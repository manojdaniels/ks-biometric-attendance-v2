import numpy as np
import os 
import logging 
from dotenv import load_dotenv



def load_embeddings(embedding_filePath):
  try:
        if not  os.path.exists(embedding_filePath):
            raise FileNotFoundError(f"Embedding file is not found at {embedding_filePath}")
        file=np.load(embedding_filePath)
        logging.info(f"File Successfully loaded ")
        class_name=file['names'].tolist()
        embeddings = file['embeddings'].astype(np.float32) 

        if not class_name:
            raise ValueError(f"Embedding file is Empty")
        
        face_representation ={name: emb for name , emb in zip(class_name, embeddings) }
        logging.info(f"Loaded {len(class_name)} embeddings successfully")

        return class_name, face_representation
  except Exception as e:
     logging.error(f"Error loaded embeddings {str(e)}")
     raise