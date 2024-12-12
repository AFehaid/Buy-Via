from abc import ABC, abstractmethod

class AIService(ABC):
    @abstractmethod
    def process_data(self):
        pass
