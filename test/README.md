# Test Files for CSV Tool CLI

This directory contains sample CSV files to test all functionalities of the CSV Tool CLI.

## Test Files

### Merge Testing
- **users1.csv** - 5 employees from Engineering, Marketing, Sales, HR
- **users2.csv** - 5 additional employees from same departments
- **Test**: Merge both files to create a combined user list

### Diff/Intersect Testing
- **all_users.csv** - All users with status (active/inactive)
- **active_users.csv** - Only active users
- **Test diff**: Find inactive users (in all_users but not in active_users) using `email` key
- **Test intersect**: Find active users (common between both files) using `email` key

### Duplicates Testing
- **contacts.csv** - Contact list with duplicate emails
- **Test**: Find duplicate entries using `email` key
- **Expected**: 4 duplicate entries (john.doe@example.com appears 3 times, jane.smith@example.com appears 2 times, alice.brown@example.com appears 2 times)

### Split Testing
- **sales_data.csv** - 25 sales records
- **Test split by count**: Split into 5 files (5 records each)
- **Test split by lines**: Split with max 10 lines per file (3 files total)

## Usage Examples

1. **Merge**: 
   - Select `merge`
   - Add `test/users1.csv` and `test/users2.csv`
   - Output: `merged_users.csv`

2. **Diff**:
   - Select `diff`
   - File 1: `test/all_users.csv`
   - File 2: `test/active_users.csv`
   - Key: `email`
   - Output: `inactive_users.csv`

3. **Intersect**:
   - Select `intersect`
   - File 1: `test/all_users.csv`
   - File 2: `test/active_users.csv`
   - Key: `email`
   - Output: `common_users.csv`

4. **Duplicates**:
   - Select `duplicates`
   - File: `test/contacts.csv`
   - Key: `email`
   - Output: `duplicate_contacts.csv`

5. **Split**:
   - Select `split`
   - File: `test/sales_data.csv`
   - Mode: `Number of sub-files` → Enter `5`
   - Output pattern: `sales_part`