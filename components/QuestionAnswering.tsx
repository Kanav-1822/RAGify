import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Upload } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type InputType = 'upload' | 'url' | 'paste';

interface Result {
  question: string;
  answer: string;
  confidence: number;
}

export default function QuestionAnswering() {
  const [inputType, setInputType] = useState<InputType>('paste');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [questions, setQuestions] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setText(data.text);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSubmit = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      setText(data.text);
    } catch (error) {
      console.error('Error fetching URL:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!text || !questions) return;

    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/qa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          questions: questions.split('\n').filter(q => q.trim()),
        }),
      });
      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error('Error processing questions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Advanced Multi-Query Question Answering System</h2>
        
        <div>
          <h3 className="mb-4">Input Type</h3>
          <RadioGroup
            value={inputType}
            onValueChange={(value: InputType) => setInputType(value)}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="upload" id="upload" />
              <Label htmlFor="upload">Upload File</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="url" id="url" />
              <Label htmlFor="url">Web URL</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="paste" id="paste" />
              <Label htmlFor="paste">Paste Text</Label>
            </div>
          </RadioGroup>
        </div>

        {inputType === 'upload' && (
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <Input
              type="file"
              accept=".pdf,.txt,.docx,.md"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <Label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <Upload className="h-10 w-10 mb-2" />
              <span>Drag and drop file here</span>
              <span className="text-sm text-gray-500">
                Limit 200MB per file • PDF, TXT, DOCX, MD
              </span>
              <Button variant="ghost" className="mt-4">
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.txt,.docx"
                />
              </Button>
            </Label>
          </div>
        )}

        {inputType === 'url' && (
          <div className="space-y-2">
            <Input
              type="url"
              placeholder="Enter webpage URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button 
              onClick={handleUrlSubmit}
              disabled={!url || loading}
              className="w-full"
            >
              Load URL
            </Button>
          </div>
        )}

        {inputType === 'paste' && (
          <Textarea
            placeholder="Enter text..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-40"
          />
        )}
      </div>
      

      {text && (
        <div className="space-y-2">
          <h3 className="font-medium">Preview Text</h3>
          <Textarea
            value={text}
            readOnly
            className="h-40"
          />
        </div>
      )}
      

      <div className="space-y-2">
        <h3 className="font-medium">Questions</h3>
        <Textarea
          placeholder="Enter questions (one per line)..."
          value={questions}
          onChange={(e) => setQuestions(e.target.value)}
          className="h-32"
        />
      </div>

      <div className="flex justify-center">
        <Button 
          onClick={handleSubmit}
          disabled={!text || !questions || loading}
          className={`w-[300px] border-2 border-[#FFFFFF] ${
            loading ? 'bg-gray-600 text-white' : 'bg-[#1A1D23] text-white hover:bg-gray-600'
          }`}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Get Answers
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={index} className="border rounded p-4">
              <h3 className="font-semibold mb-2">Q: {result.question}</h3>
              <p className="text-gray-700">A: {result.answer}</p>
              <p className="text-sm text-gray-500 mt-2">
                Confidence: {(result.confidence * 100).toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}