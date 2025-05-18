// This is a debugging component to help trace issues with the DialogProvider
import { useEffect } from "react";
import { useDialog } from "../DialogProvider";

export default function DialogDebug() {
  const dialogContext = useDialog();

  useEffect(() => {
    console.log("Dialog context:", dialogContext);
  }, [dialogContext]);

  return null;
}
