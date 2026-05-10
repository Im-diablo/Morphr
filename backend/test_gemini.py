"""
Quick test script to verify Gemini API key is working.
Run this to diagnose the ClientError issue.
"""

import os
import sys
from dotenv import load_dotenv

load_dotenv()

# Get API key from environment or prompt
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    api_key = input("Enter your Gemini API key: ").strip()

if not api_key:
    print("❌ No API key provided")
    sys.exit(1)

print(f"✓ Testing with API key: {api_key[:10]}...")

try:
    from google import genai
    from google.genai import types
    
    print("✓ google-genai package imported successfully")
    
    # Initialize client
    client = genai.Client(api_key=api_key)
    print("✓ Client initialized")
    
    # Test with simple prompt
    config = types.GenerateContentConfig(
        temperature=0.7,
    )
    
    print("✓ Calling Gemini API with gemini-2.5-flash...")
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="Say 'Hello, I am working!' in JSON format with a 'message' field.",
        config=config,
    )
    
    print("✓ API call successful!")
    print(f"\nResponse:\n{response.text}\n")
    print("✅ Your Gemini API key is working correctly!")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("\nInstall required package:")
    print("  pip install google-genai")
    
except Exception as e:
    error_type = type(e).__name__
    error_msg = str(e)
    print(f"\n❌ Error: {error_type}")
    print(f"Message: {error_msg}\n")
    
    if "ClientError" in error_type or "400" in error_msg:
        print("This is a ClientError - possible causes:")
        print("1. Invalid API key format")
        print("2. API key doesn't have access to Gemini API")
        print("3. Model not available in your region")
        print("\nGet a valid API key at: https://aistudio.google.com/apikey")
    elif "authentication" in error_msg.lower() or "api key" in error_msg.lower():
        print("Authentication failed - your API key is invalid")
        print("Get a new one at: https://aistudio.google.com/apikey")
    else:
        print("Unexpected error - check the message above")
