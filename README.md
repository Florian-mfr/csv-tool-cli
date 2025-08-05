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

## Testing

The repository includes sample CSV files in the `test/` directory to help you get started:

- **users1.csv & users2.csv** - Sample employee data for testing merge functionality
- **all_users.csv & active_users.csv** - For testing diff/intersect operations
- **contacts.csv** - Contains duplicate entries for testing duplicate detection
- **sales_data.csv** - Large dataset for testing split functionality
- **products.csv & orders.csv** - Files with different column structures for testing merge edge cases

See `test/README.md` for detailed testing instructions and expected results.

## Advanced Features

- **Smart merge**: Automatically handles CSV files with different column structures
- **Error handling**: Comprehensive validation and clear error messages
- **Column validation**: Checks if specified keys exist in CSV files
- **Permission checks**: Validates file access and write permissions

## Requirements

- Node.js >= 16.0.0

## License

MIT

## Contributing

Contributions are welcome! Feel free to open an issue or pull request.