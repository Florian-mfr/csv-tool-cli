# CSV Tool CLI

An interactive CLI tool to easily manipulate your CSV files.

## Installation

```bash
npm install -g csv-tool-cli
```

## Usage

Simply run the command:

```bash
csv-tool
```

## Features

### 🔀 Merge
Combine multiple CSV files into a single file.

### ➖ Diff
Find rows present in the first CSV but absent from the second (based on a key).

### ∩ Intersect
Find common rows between two CSV files (based on a key).

### 🔍 Duplicates
Detect and extract duplicates in a CSV file (based on a key).

### ✂️ Split
Divide a CSV file into multiple smaller files:
- By desired number of files
- By maximum number of lines per file

## Interface

The tool provides an interactive interface with:
- Graphical file selector
- Dropdown menus to choose operations
- Clear error and success messages
- Support for relative and absolute paths

## Usage Examples

1. **Merge files**: Combine `users1.csv` and `users2.csv` into `merged.csv`
2. **Find differences**: Compare two email lists to see which ones are in the first but not the second
3. **Detect duplicates**: Find duplicate emails in a contact list
4. **Split large file**: Separate `big-data.csv` into 10 smaller files

## Requirements

- Node.js >= 16.0.0

## License

MIT

## Contributing

Contributions are welcome! Feel free to open an issue or pull request.