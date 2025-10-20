# Example Data Files

This folder contains example dating app export files used for the "Try Sample Data" feature in the upload page.

## Setup

Copy the example ZIP files from the `examples/` folder in the project root:

```bash
# From project root
cp examples/tinder-data.zip public/examples/
cp examples/hinge-data.zip public/examples/
```

## Files

- `tinder-data.zip` - Sample Tinder export (~25MB)
- `hinge-data.zip` - Sample Hinge export (~23MB)

## Note

These files are gitignored to avoid committing large files to the repository. You'll need to copy them locally for development.

## Production

For production deployment, ensure these files are uploaded to your hosting provider's public assets folder or CDN.
