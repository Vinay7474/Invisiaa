from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker,declarative_base
from dotenv import load_dotenv
import os
load_dotenv() 

DBURL = os.getenv("DBURL")

engine = create_engine(
    DBURL, 
    pool_size=10,        # default 5
    max_overflow=20,     # default 10
    pool_timeout=30,     # seconds
)
sessionLocal=sessionmaker(autocommit=False, autoflush=False,bind=engine)
Base=declarative_base()
