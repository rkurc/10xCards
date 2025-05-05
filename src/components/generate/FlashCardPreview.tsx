import { useState } from "react";
import { Card, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";

interface FlashCardPreviewProps {
  id: string;
  frontContent: string;
  backContent: string;
  readabilityScore: number;
  onAccept: (id: string, frontContent: string, backContent: string) => void;
  onReject: (id: string) => void;
  onEdit: (id: string, frontContent: string, backContent: string) => void;
}

export function FlashCardPreview({
  id,
  frontContent,
  backContent,
  readabilityScore,
  onAccept,
  onReject,
  onEdit,
}: FlashCardPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [editedFront, setEditedFront] = useState(frontContent);
  const [editedBack, setEditedBack] = useState(backContent);

  const handleFlip = () => {
    if (!isEditing) {
      setIsFlipped(!isFlipped);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    onEdit(id, editedFront, editedBack);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedFront(frontContent);
    setEditedBack(backContent);
    setIsEditing(false);
  };

  const getReadabilityColor = () => {
    if (readabilityScore >= 0.8) return "bg-green-500";
    if (readabilityScore >= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card
      className={`w-full max-w-md h-64 cursor-pointer transition-all duration-300 ${isEditing ? "cursor-default" : ""}`}
    >
      <div className={`relative w-full h-full ${isFlipped ? "rotate-y-180" : ""}`} onClick={handleFlip}>
        <CardContent className={`p-6 absolute inset-0 backface-hidden ${isFlipped ? "hidden" : "block"}`}>
          {!isEditing ? (
            <div className="h-full flex flex-col">
              <div className="mb-2 flex justify-between items-center">
                <Badge variant="outline" className={`${getReadabilityColor()} text-white`}>
                  {Math.round(readabilityScore * 100)}%
                </Badge>
                <span className="text-xs text-muted-foreground">Front</span>
              </div>
              <div className="flex-grow overflow-auto">
                <p className="text-lg">{frontContent}</p>
              </div>
            </div>
          ) : (
            <Textarea
              value={editedFront}
              onChange={(e) => setEditedFront(e.target.value)}
              className="h-full resize-none"
              placeholder="Front content"
            />
          )}
        </CardContent>

        <CardContent className={`p-6 absolute inset-0 backface-hidden rotate-y-180 ${isFlipped ? "block" : "hidden"}`}>
          {!isEditing ? (
            <div className="h-full flex flex-col">
              <div className="mb-2 flex justify-end">
                <span className="text-xs text-muted-foreground">Back</span>
              </div>
              <div className="flex-grow overflow-auto">
                <p className="text-lg">{backContent}</p>
              </div>
            </div>
          ) : (
            <Textarea
              value={editedBack}
              onChange={(e) => setEditedBack(e.target.value)}
              className="h-full resize-none"
              placeholder="Back content"
            />
          )}
        </CardContent>
      </div>

      <CardFooter className="absolute bottom-0 w-full bg-background border-t p-2 flex justify-between">
        {!isEditing ? (
          <>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit();
                }}
              >
                Edit
              </Button>
            </div>
            <div>
              <Button
                variant="destructive"
                size="sm"
                className="mr-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onReject(id);
                }}
              >
                Reject
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept(id, frontContent, backContent);
                }}
              >
                Accept
              </Button>
            </div>
          </>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="default" size="sm" onClick={handleSave}>
              Save
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
