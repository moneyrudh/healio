import json
import os
import uuid

class ProviderManager:
    """Manages provider data from JSON configuration"""
    
    def __init__(self):
        self.providers_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'providers.json')
        self._providers = None
    
    def _load_providers(self):
        with open(self.providers_file, 'r') as f:
            self._providers = json.load(f)
    
    def get_all_providers(self):
        """Get all providers"""
        if self._providers is None:
            self._load_providers()
        return self._providers
    
    def get_provider_by_id(self, provider_id):
        """Get provider by ID"""
        if self._providers is None:
            self._load_providers()
            
        for provider in self._providers:
            if provider["id"] == provider_id:
                return provider
                
        return None
    
    def is_valid_provider(self, provider_id):
        """Check if provider ID exists"""
        return self.get_provider_by_id(provider_id) is not None