from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
from typing import List, Optional
import torch
from transformers import pipeline
from sentence_transformers import SentenceTransformer
from langchain.document_loaders import PyPDFLoader
from keybert import KeyBERT
import nltk
nltk.download('punkt')
nltk.download('stopwords')
from nltk.tokenize import sent_tokenize
from nltk.corpus import stopwords
import docx
import hashlib
from cachetools import LRUCache
import os
from langchain_community.document_loaders import PyPDFLoader
from nltk.tokenize import sent_tokenize
from nltk.corpus import stopwords
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import networkx as nx
import requests
from bs4 import BeautifulSoup
from pydantic import HttpUrl

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models and cache
summarizer = pipeline("summarization", model="facebook/bart-large-cnn", device=-1)
qa_model = pipeline('question-answering', model='deepset/roberta-base-squad2', device=-1)
sentence_transformer = SentenceTransformer('all-MiniLM-L6-v2')
keyword_extractor = KeyBERT()
cache = LRUCache(maxsize=300)

class SummarizeRequest(BaseModel):
    text: str
    max_length: int = 300
    min_length: int = 50

class QARequest(BaseModel):
    text: str
    questions: List[str] 

class URLRequest(BaseModel):
    url: HttpUrl


class QuestionAnsweringSystem:
    def __init__(self):
        # Initialize models and resources
        self.sentence_transformer = SentenceTransformer('all-MiniLM-L6-v2')
        self.qa_pipeline = pipeline(
            'question-answering',
            model='deepset/roberta-base-squad2',
            device=-1 if not torch.cuda.is_available() else 0
        )
        self.stop_words = set(stopwords.words('english'))

    def rank_sentences(self, query: str, sentences: List[str], top_k: int = 5) -> List[str]:
        """
        Rank sentences based on relevance to query using TextRank algorithm.
        
        Args:
            query: The question being asked
            sentences: List of sentences from the document
            top_k: Number of most relevant sentences to return
            
        Returns:
            List of top_k most relevant sentences
        """
        try:
            # Generate embeddings
            query_embedding = self.sentence_transformer.encode([query], convert_to_numpy=True)
            sentence_embeddings = self.sentence_transformer.encode(sentences, convert_to_numpy=True)
            
            # Calculate similarities
            similarity_matrix = cosine_similarity(sentence_embeddings)
            similarity_to_query = cosine_similarity(query_embedding, sentence_embeddings)[0]

            # Create graph
            G = nx.Graph()
            for i, sentence in enumerate(sentences):
                G.add_node(i, text=sentence, query_score=similarity_to_query[i])
            
            # Add edges between sentences
            for i in range(len(sentences)):
                for j in range(i + 1, len(sentences)):
                    similarity = similarity_matrix[i][j]
                    if similarity > 0.3:  # Only add edges for somewhat similar sentences
                        G.add_edge(i, j, weight=similarity)

            # Calculate PageRank with query similarity influence
            pagerank_scores = nx.pagerank(G, weight='weight')
            
            # Combine PageRank with query similarity
            final_scores = {
                i: (0.3 * pagerank_scores[i] + 0.7 * G.nodes[i]['query_score']) 
                for i in G.nodes()
            }
            
            # Get top sentences
            top_indices = sorted(final_scores.items(), key=lambda x: x[1], reverse=True)[:top_k]
            return [sentences[idx] for idx, _ in top_indices]

        except Exception as e:
            print(f"Error in sentence ranking: {e}")
            return sentences[:top_k]  # Fallback to first k sentences

    def get_answer(self, question: str, context: str) -> dict:
        """
        Generate answer for a question using the context.
        
        Args:
            question: The question to answer
            context: The context to use for answering
            
        Returns:
            Dictionary containing answer and confidence score
        """
        try:
            result = self.qa_pipeline(
                question=question,
                context=context,
                max_answer_len=50,
                handle_impossible_answer=True
            )
            return {
                "answer": result["answer"],
                "confidence": round(float(result["score"]), 4)
            }
        except Exception as e:
            print(f"Error generating answer: {e}")
            return {
                "answer": "Unable to generate answer",
                "confidence": 0.0
            }    
    

@app.post("/api/summarize")
async def summarize_text(request: SummarizeRequest):
    try:
        summary = summarizer(request.text, 
                           max_length=request.max_length,
                           min_length=request.min_length)[0]['summary_text']
        
        keywords = keyword_extractor.extract_keywords(request.text, 
                                                    keyphrase_ngram_range=(1, 2),
                                                    stop_words='english')
        
        return {
            "summary": summary,
            "keywords": [k[0] for k in keywords[:10]],
            "originalLength": len(request.text),
            "summaryLength": len(summary)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

qa_system = QuestionAnsweringSystem()

@app.post("/api/qa")
async def answer_questions(request: QARequest):
    try:
        # Validate input
        if not request.text or not request.questions:
            raise HTTPException(status_code=400, detail="Text and questions are required")

        # Split text into sentences
        sentences = sent_tokenize(request.text)
        if not sentences:
            raise HTTPException(status_code=400, detail="No valid sentences found in the text")

        results = []
        for question in request.questions:
            # Get most relevant sentences for this question
            relevant_sentences = qa_system.rank_sentences(question, sentences)
            
            # Combine relevant sentences into a focused context
            focused_context = " ".join(relevant_sentences)
            
            # Get answer using the focused context
            answer_result = qa_system.get_answer(question, focused_context)
            
            results.append({
                "question": question,
                "answer": answer_result["answer"],
                "confidence": answer_result["confidence"],
                "relevant_context": relevant_sentences[:3]  # Include top 3 relevant sentences
            })
        
        return {
            "results": results,
            "status": "success"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        file_path = f"temp/{file.filename}"
        os.makedirs("temp", exist_ok=True)
        
        with open(file_path, "wb") as f:
            f.write(contents)
            
        # Process file based on extension
        text = ""
        if file.filename.endswith('.pdf'):
            loader = PyPDFLoader(file_path)
            pages = loader.load()
            text = " ".join([p.page_content for p in pages])
        elif file.filename.endswith('.txt'):
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
        elif file.filename.endswith('.docx'):
            doc = docx.Document(file_path)
            text = " ".join([p.text for p in doc.paragraphs])
            
        os.remove(file_path)  # Clean up
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@app.post("/api/url")
async def process_url(request: URLRequest):
    try:
        response = requests.get(str(request.url))
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
            
        # Get text content
        text = soup.get_text()
        
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = ' '.join(chunk for chunk in chunks if chunk)
        
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))    

# if __name__ == "__main__":
#     uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=Tru/e)