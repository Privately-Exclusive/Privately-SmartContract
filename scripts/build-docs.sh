#!/bin/bash

npm i
./docker/run_prod_node.sh stop

SOURCE_DIR="artifacts/contracts"
DEST_DIR="lib"

# Loop through each subdirectory in the source directory
for dir in "$SOURCE_DIR"/*/; do
  # Loop through each .json file in the current subdirectory, excluding .dbg.json files
  for file in "$dir"*.json; do
    # Exclude .dbg.json files
    if [[ "$file" != *.dbg.json && -e "$file" ]]; then
      # Copy the .json file to the destination directory
      cp "$file" "$DEST_DIR"
    fi
  done
done

echo "All .json files have been copied to $DEST_DIR"

# Generate the documentation
cd $DEST_DIR
npx typedoc