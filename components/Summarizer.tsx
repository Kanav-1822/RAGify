import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Upload } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type InputType = 'upload' | 'url';

// Define an interface for the result object
interface SummaryResult {
  summary: string;
  keywords: string[];
  originalLength: number;
  summaryLength: number;
}

export default function Summarizer() {
  const [inputType, setInputType] = useState<InputType>('upload');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null); // Use the interface here
  
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
    if (!text) return;

    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          max_length: 300,
          min_length: 50,
        }),
      });
      const data: SummaryResult = await response.json(); // Use the interface here
      setResult(data);
    } catch (error) {
      console.error('Error summarizing text:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Advanced Text Summarization System</h2>
        
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

      <div className="flex justify-center">
        <Button 
          onClick={handleSubmit}
          disabled={!text || loading}
          className={`w-[300px] border-2 border-[#FFFFFF] ${
            loading ? 'bg-gray-600 text-white' : 'bg-[#1A1D23] text-white hover:bg-gray-600'
          }`}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Summarize
        </Button>
      </div>

      {result && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Summary</h3>
            <p className="text-gray-700">{result.summary}</p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {result.keywords.map((keyword: string, index: number) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Original Length</p>
              <p className="font-medium">{result.originalLength} characters</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Summary Length</p>
              <p className="font-medium">{result.summaryLength} characters</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
