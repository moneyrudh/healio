import requests
import time
import json
import os
# import pandas as pd
from typing import List, Dict
import xml.etree.ElementTree as ET
import os

class PMCScraper:
    def __init__(self):
        self.base_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
        # Use your email here - PMC requires this for high-volume requests
        self.email = "anirudhananth99@gmail.com"
        # Get an API key from https://ncbiinsights.ncbi.nlm.nih.gov/2017/11/02/new-api-keys-for-the-e-utilities/
        self.api_key = os.getenv("NLM_PVT_KEY")
        
    def search_articles(self, query: str, max_results: int = 1000) -> List[str]:
        """Search for articles and get their PMCIDs"""
        
        search_url = f"{self.base_url}esearch.fcgi"
        params = {
            "db": "pmc",
            "term": query,
            "retmax": max_results,
            "usehistory": "y",
            "email": self.email,
            "api_key": self.api_key
        }
        
        response = requests.get(search_url, params=params)
        root = ET.fromstring(response.content)
        
        # Extract PMCIDs
        id_list = root.find("IdList")
        if id_list is None:
            print(f"Warning: No results found for query: {query}")
            return []
            
        pmcids = [id_elem.text for id_elem in id_list.findall("Id")]
        
        return pmcids
    
    def get_article_data(self, pmcid: str) -> Dict:
        """Get detailed data for a single article including PMID and authors"""
        
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
            "pmid": "",
            "title": "",
            "abstract": "",
            "body_text": "",
            "keywords": [],
            "authors": ""  # Added authors field
        }
        
        # Get PMID
        pmid_elem = root.find(".//article-id[@pub-id-type='pmid']")
        if pmid_elem is not None and pmid_elem.text:
            article_data["pmid"] = pmid_elem.text
            
        # Get title
        title_elem = root.find(".//article-title")
        if title_elem is not None and title_elem.text:
            article_data["title"] = title_elem.text
            
        # Get authors
        authors = []
        # Try the standard contrib-group method first
        contrib_group = root.find(".//contrib-group")
        if contrib_group is not None:
            for contrib in contrib_group.findall(".//contrib[@contrib-type='author']"):
                surname = contrib.find(".//surname")
                given_name = contrib.find(".//given-names")
                
                name_parts = []
                if given_name is not None and given_name.text:
                    name_parts.append(given_name.text)
                if surname is not None and surname.text:
                    name_parts.append(surname.text)
                    
                if name_parts:
                    authors.append(" ".join(name_parts))
        
        # If no authors found, try alternative formats
        if not authors:
            # Some articles have a simple author-notes section
            author_notes = root.find(".//author-notes")
            if author_notes is not None:
                author_elem = author_notes.find(".//p")
                if author_elem is not None and author_elem.text:
                    authors = [author_elem.text]
        
        # Join all author names with commas
        if authors:
            article_data["authors"] = ", ".join(authors)
            
        # Get abstract
        abstract_elem = root.find(".//abstract")
        if abstract_elem is not None:
            # Some abstracts have nested <p> elements
            paragraphs = abstract_elem.findall(".//p")
            if paragraphs:
                article_data["abstract"] = " ".join([p.text for p in paragraphs if p is not None and p.text])
            # Some abstracts might be directly in the abstract element
            elif abstract_elem.text and abstract_elem.text.strip():
                article_data["abstract"] = abstract_elem.text
            
        # Get keywords
        kwd_group = root.find(".//kwd-group")
        if kwd_group is not None:
            article_data["keywords"] = [kwd.text for kwd in kwd_group.findall(".//kwd") if kwd is not None and kwd.text]
            
        # Get body text
        body_elem = root.find(".//body")
        if body_elem is not None:
            paragraphs = body_elem.findall(".//p")
            if paragraphs:
                # Join all paragraph texts, filtering out None
                paragraph_texts = [p.text for p in paragraphs if p is not None and p.text]
                if paragraph_texts:
                    article_data["body_text"] = " ".join(paragraph_texts)
            
        return article_data
    
    def bulk_download(self, query: str, max_results: int = 1000, delay: float = 1.0) -> List[Dict]:
        """Bulk download articles matching a query"""
        
        print(f"Searching for articles matching query: {query}")
        pmcids = self.search_articles(query, max_results)
        print(f"Found {len(pmcids)} articles")
        
        articles = []
        for i, pmcid in enumerate(pmcids):
            print(f"Downloading article {i+1}/{len(pmcids)} (PMCID: {pmcid})")
            try:
                article_data = self.get_article_data(pmcid)
                articles.append(article_data)
                time.sleep(delay)  # Be nice to PMC servers
            except Exception as e:
                print(f"Error downloading article {pmcid}: {str(e)}")
                continue
                
        return articles
    
    def save_to_json(self, articles: List[Dict], filename: str):
        """Save articles to JSON file"""
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(articles, f, indent=2, ensure_ascii=False)
            
    # def save_to_csv(self, articles: List[Dict], filename: str):
    #     """Save articles to CSV file"""
    #     # Create directory if it doesn't exist
    #     os.makedirs(os.path.dirname(filename), exist_ok=True)
        
    #     df = pd.DataFrame(articles)
    #     df.to_csv(filename, index=False)

if __name__ == "__main__":
    scraper = PMCScraper()
    
    # Define medical categories with their search queries
    medical_categories = {
        "diseases_and_conditions": [
            # Cardiovascular
            "cardiovascular diseases[MeSH] AND diagnosis[MeSH]",
            "heart failure[MeSH] AND treatment[Title/Abstract]",
            "hypertension[MeSH] AND complications[MeSH Subheading]",
            "coronary artery disease[MeSH] AND risk factors[MeSH]",
            # Respiratory
            "respiratory tract diseases[MeSH] AND therapy[MeSH Subheading]",
            "asthma[MeSH] AND management[Title/Abstract]",
            "pneumonia[MeSH] AND treatment outcome[MeSH]",
            "chronic obstructive pulmonary disease[MeSH] AND exacerbation[Title/Abstract]",
            # Metabolic/Endocrine
            "diabetes mellitus[MeSH] AND complications[MeSH Subheading]",
            "diabetes mellitus, type 2[MeSH] AND treatment[Title/Abstract]",
            "thyroid diseases[MeSH] AND diagnosis[MeSH]",
            "metabolic syndrome[MeSH] AND therapy[MeSH Subheading]",
            # Neurological
            "nervous system diseases[MeSH] AND therapy[MeSH Subheading]",
            "Alzheimer disease[MeSH] AND treatment[Title/Abstract]",
            "Parkinson disease[MeSH] AND management[Title/Abstract]",
            "epilepsy[MeSH] AND drug therapy[MeSH Subheading]"
        ],
        "symptoms_and_presentations": [
            "signs and symptoms[MeSH] AND diagnosis[MeSH]",
            "pain[MeSH] AND management[Title/Abstract]",
            "fever[MeSH] AND etiology[MeSH Subheading]",
            "fatigue[MeSH] AND treatment[Title/Abstract]",
            "cough[MeSH] AND differential diagnosis[MeSH]"
        ],
        "therapeutic_approaches": [
            "therapeutics[MeSH] AND methods[MeSH Subheading]",
            "drug therapy[MeSH] AND adverse effects[MeSH Subheading]",
            "surgery[MeSH] AND methods[MeSH Subheading]",
            "preventive medicine[MeSH] AND standards[MeSH Subheading]",
            "rehabilitation[MeSH] AND methods[MeSH Subheading]"
        ],
        "emergency_and_critical_care": [
            "emergencies[MeSH] AND therapy[MeSH Subheading]",
            "critical care[MeSH] AND methods[MeSH Subheading]",
            "trauma[Title/Abstract] AND management[Title/Abstract]",
            "shock[MeSH] AND treatment[Title/Abstract]"
        ],
        "infectious_diseases": [
            "communicable diseases[MeSH] AND therapy[MeSH Subheading]",
            "bacterial infections[MeSH] AND drug therapy[MeSH Subheading]",
            "viral diseases[MeSH] AND complications[MeSH Subheading]",
            "infection[MeSH] AND prevention and control[MeSH Subheading]"
        ]
    }
    
    # Create output directory
    output_dir = "medical_literature"
    os.makedirs(output_dir, exist_ok=True)
    
    # Process each medical category
    for category, queries in medical_categories.items():
        print(f"\nProcessing {category.upper()} articles...")
        category_articles = []
        
        for query in queries:
            # Limit to a smaller number per query to get wider coverage
            articles = scraper.bulk_download(query, max_results=100)
            category_articles.extend(articles)
            
            # Be extra nice to PMC servers
            time.sleep(2)
        
        # Remove duplicates based on pmcid
        unique_articles = {article['pmcid']: article for article in category_articles}.values()
        unique_list = list(unique_articles)
        
        # Save category-specific results
        output_file = f'{output_dir}/{category}.json'
        scraper.save_to_json(unique_list, output_file)
        print(f"Saved {len(unique_list)} unique {category} articles to {output_file}")

        # Create a simple report of how many articles have PMIDs and authors
        pmid_count = sum(1 for article in unique_list if article['pmid'])
        authors_count = sum(1 for article in unique_list if article['authors'])
        print(f"  - {pmid_count} out of {len(unique_list)} articles have PMID ({pmid_count/len(unique_list)*100:.1f}%)")
        print(f"  - {authors_count} out of {len(unique_list)} articles have author information ({authors_count/len(unique_list)*100:.1f}%)")