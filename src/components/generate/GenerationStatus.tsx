import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { useGenerationContext } from '../../contexts/generation-context';

interface GenerationStatusProps {
  generationId: string;
  onComplete: () => void;
}

export function GenerationStatus({ generationId, onComplete }: GenerationStatusProps) {
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/generation/${generationId}/status`);
        const data = await response.json();
        
        setStatus(data.status);
        setProgress(data.progress);
        
        if (data.error) {
          setError(data.error);
        }
        
        if (data.status === 'completed') {
          onComplete();
        } else if (data.status !== 'failed') {
          // Continue polling if not completed or failed
          setTimeout(checkStatus, 2000);
        }
      } catch (err) {
        console.error('Failed to check generation status:', err);
        setError('Failed to check generation status. Please try again.');
        setStatus('failed');
      }
    };
    
    checkStatus();
  }, [generationId, onComplete]);
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">
        {status === 'pending' && 'Preparing generation...'}
        {status === 'processing' && 'Generating your flashcards...'}
        {status === 'completed' && 'Generation complete!'}
        {status === 'failed' && 'Generation failed'}
      </h3>
      
      <Progress value={progress} className="w-full" />
      
      <p className="text-sm text-muted-foreground">
        {status === 'pending' && 'Your request is in the queue.'}
        {status === 'processing' && `Progress: ${progress}%`}
        {status === 'completed' && 'All flashcards have been generated successfully.'}
      </p>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {status === 'failed' && (
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      )}
    </div>
  );
}