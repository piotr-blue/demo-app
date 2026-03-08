export function createSyntheticReferenceFile(params: {
  fileName: string;
  text: string;
}): File {
  const fileName = params.fileName.trim() || "document-reference.myos.txt";
  return new File([params.text], fileName, {
    type: "text/plain",
  });
}
