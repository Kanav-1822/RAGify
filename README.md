# RAG-Based Summarizer and Multi-Query QnA

## About the Project
This project is a **RAG-Based Summarizer and Multi-Query Question Answering System** designed to process various document formats and provide structured, concise information. The tool extracts key insights from uploaded documents and enables users to ask multiple queries about the content, delivering precise answers based on the given data.

### Key Features:
- Summarization of documents using a RAG(**Retrieval-Augmented Generation**)-based approach.
- Multi-query question-answering system for in-depth analysis of documents.
- Supports multiple file formats, including `.doc`, `.pdf`, `.json`, `Web-Scraping` and `plain text`.
- Frontend developed using **Next.js** for seamless user interaction.
- Backend powered by **Python** and **RAG Based Model** for text processing.

## Technologies Used
This project is built using the following technologies:

1. **Frontend**
   - Next.js (React Framework)
   - TypeScript
   - Tailwind CSS
   
2. **Backend**
   - Python (FastAPI / Flask for API development)
   - LangChain for RAG-based summarization and QnA
   - OpenAI GPT API for text generation

3. **Additional Tools & Libraries**
   - PyPDF2 for PDF parsing
   - Beautiful Soup for webpage text extraction

## Installation Guide
To set up the project on your local system, follow these steps:

## Project Directory Structure
```
RAG-Summarizer-MultiQnA/
│── backend/                
│   ├── main.py             # Create main.py or upload the main.py file
│   ├── models/                        
│   └── node modules    
│
│── frontend/               
│   ├── pages/              
│   ├── app/                # Add page.tsx File here
│   ├── components/         # Add QuestionAnswering.tsx and Summarizer.tsx under components section
│   ├── styles/             
│   ├── public/             
│   ├── package.json        
│   └── tsconfig.json       
│
│── requirements.txt        # Python dependencies
└── .gitignore              # Git ignore file
```

### 1. Clone the Repository
```sh
git clone https://github.com/your-username/RAG-Summarizer-MultiQnA.git
cd RAG-Summarizer-MultiQnA
```

### 2. Install Dependencies
#### **Backend (Python)**
```sh
cd backend
python -m venv env
source env/bin/activate  # On Windows: env\Scripts\activate
pip install -r requirements.txt
```

#### **Frontend (Next.js)**
```sh
cd frontend
npm install
```

### 3. Run the Backend Server
```sh
cd backend
python main.py  
```

### 4. Run the Frontend Application
```sh
cd frontend
npm run dev
```



## Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [LangChain Documentation](https://python.langchain.com/en/latest/)
- [PyPDF2](https://pypi.org/project/PyPDF2/)

---

