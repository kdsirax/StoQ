from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import List

class IncomingNews(BaseModel):
    title: str = Field(alias="title")
    description: str
    source: str
    date: datetime = Field(alias="date")

    model_config = ConfigDict(populate_by_name=True)