import requests
import os
import xml.etree.ElementTree as ET
from typing import Dict

class PMCScraper:
    def __init__(self):
        self.base_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
        self.email = "anirudhananth99@gmail.com"  # Your email
        self.api_key = "3fff47fa1e47f3937bc53749076125391a08"  # Your API key
        
    def get_single_article(self, pmcid: str) -> Dict:
        """Get detailed data for a single article including PMID"""
        
        fetch_url = f"{self.base_url}efetch.fcgi"
        params = {
            "db": "pmc",
            "id": pmcid,
            "rettype": "xml",
            "email": self.email,
            "api_key": self.api_key
        }
        
        response = requests.get(fetch_url, params=params)
        root = ET.fromstring(response.content)
        
        # Extract relevant fields
        article_data = {
            "pmcid": pmcid,
            "pmid": "",  # Added PMID field
            "title": "",
            "abstract": "",
            "body_text": "",
            "keywords": []
        }
        
        # Get PMID
        pmid_elem = root.find(".//article-id[@pub-id-type='pmid']")
        if pmid_elem is not None:
            article_data["pmid"] = pmid_elem.text
            
        # Get title
        title_elem = root.find(".//article-title")
        if title_elem is not None and title_elem.text is not None:
            article_data["title"] = title_elem.text
            
        # Get abstract
        abstract_elem = root.find(".//abstract")
        if abstract_elem is not None:
            paragraphs = abstract_elem.findall(".//p")
            if paragraphs:
                article_data["abstract"] = " ".join([p.text for p in paragraphs if p.text])
            
        # Get keywords
        kwd_group = root.find(".//kwd-group")
        if kwd_group is not None:
            article_data["keywords"] = [kwd.text for kwd in kwd_group.findall(".//kwd") if kwd.text]
            
        # Get body text (limit to first paragraph for testing)
        body_elem = root.find(".//body")
        if body_elem is not None:
            paragraphs = body_elem.findall(".//p")
            if paragraphs and paragraphs[0].text:
                article_data["body_text"] = paragraphs[0].text + "..."  # Just show first paragraph
            
        return article_data

# Test with a sample article
if __name__ == "__main__":
    scraper = PMCScraper()
    
    # Use a sample PMCID - PMC3539452 is a random medical article
    sample_pmcid = "3539452"
    
    print("Fetching sample article...")
    article = scraper.get_single_article(sample_pmcid)
    
    print("\nArticle Details:")
    print(f"PMCID: {article['pmcid']}")
    print(f"PMID: {article['pmid']}")  # This should show the PMID if extraction works
    print(f"Title: {article['title']}")
    print(f"Abstract: {article['abstract'][:150]}..." if article['abstract'] else "No abstract available")
    print(f"Keywords: {', '.join(article['keywords'])}" if article['keywords'] else "No keywords available")
    print(f"Body text preview: {article['body_text'][:150]}..." if article['body_text'] else "No body text available")