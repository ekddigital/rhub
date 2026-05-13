# RHub VPS Admin API - Complete Reference

> Document conversion and VPS management API for remote document processing with real-time status monitoring.

**Base URL**: `http://localhost:3000/api/v1/admin` (or your RHub server URL)

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [System Management](#system-management)
4. [Document Conversion](#document-conversion)
5. [Package Management](#package-management)
6. [Storage & Cache](#storage--cache)
7. [Error Handling](#error-handling)

---

## Quick Start

### 1. Check System Status

```bash
curl -X GET http://localhost:3000/api/v1/admin/status
```

**Response**:

```json
{
  "data": {
    "status": "healthy",
    "vps": {
      "connected": true,
      "latency_ms": 45
    },
    "storage": {
      "available": true,
      "used_gb": 128.5,
      "total_gb": 500,
      "percent_used": 25.7
    }
  }
}
```

### 2. Install Document Conversion Tools

```bash
curl -X POST http://localhost:3000/api/v1/admin/install/all \
  -H "Authorization: Bearer ADMIN_API_KEY" \
  -H "Content-Type: application/json"
```

### 3. Start Converting Documents

```bash
curl -X POST http://localhost:3000/api/v1/admin/convert \
  -H "Authorization: Bearer ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input_file": "/path/to/document.docx",
    "output_format": "pdf"
  }'
```

---

## Authentication

### API Key

Protected endpoints require `ADMIN_API_KEY` environment variable:

```bash
# Development (localhost)
curl http://localhost:3000/api/v1/admin/status

# Production
curl -H "Authorization: Bearer your_admin_key" \
  https://rhub.example.com/api/v1/admin/status
```

### Authentication Rules

- **Localhost**: No authentication required
- **Production**: `Authorization: Bearer ADMIN_API_KEY` header required
- **Privileged Operations**: Only superadmin keys can install packages

---

## System Management

### System Status

**Endpoint**: `GET /status`

Get overall system health and readiness.

**Request**:

```bash
curl http://localhost:3000/api/v1/admin/status
```

**Response** (200 OK):

```json
{
  "data": {
    "status": "healthy",
    "vps": {
      "connected": true,
      "latency_ms": 45,
      "host": "vps.example.com",
      "port": 22
    },
    "storage": {
      "available": true,
      "used_gb": 128.5,
      "total_gb": 500,
      "percent_used": 25.7,
      "temp_files_mb": 240.3
    },
    "conversion": {
      "ready": true,
      "tools_installed": true,
      "tools_count": 12
    }
  }
}
```

### Detailed Status

**Query Parameter**: `?detailed=true`

Get comprehensive system information including memory and CPU usage.

**Request**:

```bash
curl 'http://localhost:3000/api/v1/admin/status?detailed=true'
```

**Response**:

```json
{
  "data": {
    "status": "healthy",
    "vps": {
      "connected": true,
      "hostname": "vps-prod-1",
      "os": "Ubuntu 22.04 LTS",
      "uptime_days": 156
    },
    "system": {
      "cpu": {
        "cores": 8,
        "usage_percent": 24.5,
        "temp_celsius": 52
      },
      "memory": {
        "total_mb": 16384,
        "used_mb": 8192,
        "available_mb": 8192,
        "usage_percent": 50
      },
      "disk": {
        "total_gb": 500,
        "used_gb": 128.5,
        "available_gb": 371.5,
        "usage_percent": 25.7
      }
    },
    "conversion": {
      "ready": true,
      "tools_installed": true,
      "tools_count": 12,
      "last_check": "2026-01-15T10:35:00.000Z"
    }
  }
}
```

---

## Document Conversion

### Check Conversion Readiness

**Endpoint**: `GET /conversion/ready`

Verify all required tools are installed and document conversion is available.

**Response**:

```json
{
  "data": {
    "ready": true,
    "tools": {
      "libreoffice": { "installed": true, "version": "7.4.0" },
      "imagemagick": { "installed": true, "version": "7.1.1" },
      "ffmpeg": { "installed": true, "version": "5.1.0" },
      "ghostscript": { "installed": true, "version": "9.56.1" }
    },
    "message": "All conversion tools are installed and ready"
  }
}
```

### Convert Document

**Endpoint**: `POST /convert`

Convert a document to a different format.

**Request Body**:

```json
{
  "input_file": "/path/to/document.docx",
  "output_format": "pdf",
  "output_path": "/tmp/output",
  "options": {
    "quality": "high",
    "preserve_formatting": true
  }
}
```

**Parameters**:

| Parameter       | Type   | Required | Description                                             |
| --------------- | ------ | -------- | ------------------------------------------------------- |
| `input_file`    | String | Yes      | Path to input file                                      |
| `output_format` | String | Yes      | Target format: `pdf`, `png`, `jpg`, `doc`, `docx`, etc. |
| `output_path`   | String | No       | Output directory (default: same as input)               |
| `options`       | Object | No       | Format-specific options                                 |

**Response** (200 OK):

```json
{
  "data": {
    "input_file": "/path/to/document.docx",
    "output_file": "/path/to/document.pdf",
    "output_format": "pdf",
    "file_size_bytes": 1048576,
    "conversion_time_ms": 2450,
    "status": "completed",
    "message": "Document converted successfully"
  }
}
```

### Batch Conversion

**Endpoint**: `POST /convert/batch`

Convert multiple documents at once.

**Request Body**:

```json
{
  "files": [
    {
      "input_file": "/documents/report1.docx",
      "output_format": "pdf"
    },
    {
      "input_file": "/documents/report2.docx",
      "output_format": "pdf"
    }
  ],
  "parallel_jobs": 4
}
```

**Response** (200 OK):

```json
{
  "data": {
    "total": 2,
    "completed": 2,
    "failed": 0,
    "results": [
      {
        "input_file": "/documents/report1.docx",
        "output_file": "/documents/report1.pdf",
        "status": "completed",
        "conversion_time_ms": 2450
      },
      {
        "input_file": "/documents/report2.docx",
        "output_file": "/documents/report2.pdf",
        "status": "completed",
        "conversion_time_ms": 2680
      }
    ]
  }
}
```

---

## Package Management

### Install All Tools

**Endpoint**: `POST /install/all`

Install all required document conversion tools. **Requires admin authentication**.

**Request**:

```bash
curl -X POST http://localhost:3000/api/v1/admin/install/all \
  -H "Authorization: Bearer your_admin_key" \
  -H "Content-Type: application/json"
```

**Response** (200 OK):

```json
{
  "data": {
    "status": "installing",
    "tools": ["libreoffice", "imagemagick", "ffmpeg", "ghostscript"],
    "progress": 0,
    "estimated_time_seconds": 180,
    "log_url": "/api/v1/admin/install/logs?task_id=install_all_12345"
  }
}
```

### Install Specific Tool

**Endpoint**: `POST /install/{tool}`

Install a specific tool.

**Available Tools**:

| Tool          | Purpose                             |
| ------------- | ----------------------------------- |
| `libreoffice` | Office document conversion          |
| `imagemagick` | Image processing                    |
| `ffmpeg`      | Video/audio conversion              |
| `ghostscript` | PDF processing                      |
| `pandoc`      | Document format conversion          |
| `tesseract`   | OCR (Optical Character Recognition) |

**Example**:

```bash
curl -X POST http://localhost:3000/api/v1/admin/install/libreoffice \
  -H "Authorization: Bearer your_admin_key"
```

**Response**:

```json
{
  "data": {
    "tool": "libreoffice",
    "status": "installed",
    "version": "7.4.0",
    "installation_time_ms": 45000,
    "message": "LibreOffice installed successfully"
  }
}
```

### Get Installed Packages

**Endpoint**: `GET /packages`

List all installed tools and their versions.

**Response** (200 OK):

```json
{
  "data": [
    {
      "name": "libreoffice",
      "version": "7.4.0",
      "installed": true,
      "installed_at": "2026-01-10T15:30:00.000Z",
      "size_mb": 320
    },
    {
      "name": "imagemagick",
      "version": "7.1.1",
      "installed": true,
      "installed_at": "2026-01-10T16:00:00.000Z",
      "size_mb": 45
    }
  ]
}
```

### Check Package Version

**Endpoint**: `GET /packages/{name}`

**Response**:

```json
{
  "data": {
    "name": "libreoffice",
    "installed": true,
    "version": "7.4.0",
    "path": "/usr/bin/libreoffice",
    "size_mb": 320
  }
}
```

---

## Storage & Cache

### Storage Statistics

**Endpoint**: `GET /storage`

Get storage usage and statistics.

**Response** (200 OK):

```json
{
  "data": {
    "total_gb": 500,
    "used_gb": 128.5,
    "available_gb": 371.5,
    "usage_percent": 25.7,
    "paths": {
      "home_gb": 50.2,
      "temp_gb": 240.3,
      "documents_gb": 128.5,
      "conversions_gb": 45.8
    }
  }
}
```

### Clear Cache

**Endpoint**: `POST /cache/clear`

Clear temporary conversion files and cache.

**Request Body** (optional):

```json
{
  "types": ["temp_files", "conversion_cache", "thumbnails"],
  "older_than_days": 7
}
```

**Response** (200 OK):

```json
{
  "data": {
    "cleared_mb": 1024,
    "files_deleted": 245,
    "freed_space_gb": 1.0
  }
}
```

### Cache Statistics

**Endpoint**: `GET /cache/stats`

Get cache usage information.

**Response**:

```json
{
  "data": {
    "total_cached_mb": 2048,
    "cache_size_percent": 12.5,
    "cached_conversions": 142,
    "oldest_cache_entry": "2026-01-08T10:00:00.000Z",
    "newest_cache_entry": "2026-01-15T10:30:00.000Z"
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "FILE_NOT_FOUND",
    "message": "Input file does not exist",
    "details": {
      "path": "/path/to/nonexistent.docx"
    }
  }
}
```

### Common Error Codes

| Code                   | HTTP Status | Description                             |
| ---------------------- | ----------- | --------------------------------------- |
| `FILE_NOT_FOUND`       | 404         | Input file not found                    |
| `TOOLS_NOT_INSTALLED`  | 503         | Required conversion tools not installed |
| `VPS_DISCONNECTED`     | 503         | Unable to connect to VPS                |
| `CONVERSION_FAILED`    | 500         | Document conversion failed              |
| `INSUFFICIENT_STORAGE` | 507         | Not enough disk space                   |
| `INVALID_FORMAT`       | 400         | Unsupported output format               |
| `UNAUTHORIZED`         | 401         | API key missing or invalid              |
| `FORBIDDEN`            | 403         | Operation not permitted                 |

### Error Examples

#### File Not Found

```json
{
  "error": {
    "code": "FILE_NOT_FOUND",
    "message": "Input file does not exist at /path/to/document.docx",
    "status": 404
  }
}
```

#### Insufficient Storage

```json
{
  "error": {
    "code": "INSUFFICIENT_STORAGE",
    "message": "Not enough disk space. Required: 500 MB, Available: 128 MB",
    "status": 507
  }
}
```

---

## Best Practices

### Conversion Flow

1. **Check Status**: Verify system is healthy

   ```bash
   curl http://localhost:3000/api/v1/admin/status
   ```

2. **Verify Tools**: Ensure required tools are installed

   ```bash
   curl http://localhost:3000/api/v1/admin/conversion/ready
   ```

3. **Convert Document**: Submit conversion request

   ```bash
   curl -X POST http://localhost:3000/api/v1/admin/convert \
     -H "Content-Type: application/json" \
     -d '{...}'
   ```

4. **Monitor Storage**: Keep cache clean
   ```bash
   curl http://localhost:3000/api/v1/admin/storage
   curl -X POST http://localhost:3000/api/v1/admin/cache/clear
   ```

### Error Handling

```javascript
async function convertDocument(inputFile, outputFormat) {
  try {
    // Check status first
    const status = await fetch("http://localhost:3000/api/v1/admin/status");
    if (!status.ok) throw new Error("System not ready");

    // Convert document
    const response = await fetch("http://localhost:3000/api/v1/admin/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input_file: inputFile,
        output_format: outputFormat,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Conversion failed: ${error.error.message}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Conversion error:", error);
    // Retry logic or fallback
  }
}
```

---

## Support

**Email**: support@rhub.example.com  
**Documentation**: https://rhub.example.com/docs  
**Logs**: `/var/log/rhub/`
