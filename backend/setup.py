import os
import sys

def setup_backend():
    print("Setting up Krishimitra Backend...")
    
    # Create virtual environment
    print("Creating virtual environment...")
    os.system("python -m venv venv")
    
    print("\nVirtual environment created. Please activate it:")
    print("Windows: venv\\Scripts\\activate")
    print("Mac/Linux: source venv/bin/activate")
    
    print("\nThen install requirements:")
    print("pip install -r requirements.txt")
    
    print("\nTo run the backend:")
    print("python app.py")

if __name__ == "__main__":
    setup_backend()