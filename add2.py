import sys

def add_contents(file1, file2):
    try:
        # Read contents from both files
        with open(file1, 'r') as f1, open(file2, 'r') as f2:
            content1 = f1.read()
            content2 = f2.read()
        
        # Try to convert contents to integers and add them
        try:
            result = int(content1) + int(content2)
        except ValueError:
            # If conversion fails, concatenate strings
            result = content1 + content2
        
        return result
    except FileNotFoundError as e:
        return f"Error: {e}"

def write_output(result, output_file):
    with open(output_file, 'w') as f:
        f.write(f"Your output is: {result}")

if __name__ == '__main__':
    if len(sys.argv) != 4:
        print("Usage: python script.py <file1> <file2>")
        sys.exit(1)

    # Get command line arguments
    file1 = sys.argv[1]
    file2 = sys.argv[2]
    output_file = sys.argv[3]

    result = add_contents(file1, file2)
    print(result)

    #output_file = 'output.txt'
    write_output(result, output_file)
    print(f"Result written to {output_file}")

