# Cloudinary file storage

The project is configured to use Cloudinary as the default file storage backend.

## Environment variables

Recommended Render/backend values:

```env
FILE_STORAGE_BACKEND=cloudinary
CLOUDINARY_FOLDER=growcore
```

Then use either a single Cloudinary URL:

```env
CLOUDINARY_URL=cloudinary://<api-key>:<api-secret>@<cloud-name>
```

Or three separate values:

```env
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
```

If `CLOUDINARY_URL` is set, the separate Cloudinary values are optional.

## What is stored in Cloudinary

- User avatars: public image assets.
- Product images: public image assets.
- Seller request documents: authenticated private assets.

The frontend already supports Cloudinary URLs because absolute `https://...`
media URLs are returned unchanged.

## Render note

Render Free does not provide persistent disk storage. Keep
`FILE_STORAGE_BACKEND=cloudinary` in Render so uploaded files survive deploys and
service restarts.
