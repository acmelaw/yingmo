# Smart Layer Feature Implementation Guide

## Overview
This guide provides a step-by-step plan for implementing the Smart Layer feature now that the refactoring is complete.

## User Story
"As a user, I want to drag-and-drop a screenshot into the app, and have it automatically extracted into structured data using configurable AI transformations, with each transformation cached as a non-destructive layer."

## Feature Components

### 1. Image Note Module
**Location**: `src/modules/image/`

#### Features:
- Drag-and-drop image upload
- Paste from clipboard
- File picker upload
- Image preview with zoom
- Basic metadata (dimensions, file size, type)
- Storage options (IndexedDB for large files, base64 for small)

#### Components to Create:
```
src/modules/image/
├── index.ts                    # Module definition
├── imageHandler.ts             # CRUD operations
├── storage.ts                  # IndexedDB wrapper
└── components/
    ├── ImageNoteEditor.vue     # Edit/upload UI
    ├── ImageNoteViewer.vue     # Display UI
    ├── ImageDropZone.vue       # Drag-drop component
    └── ImagePreview.vue        # Zoomable preview
```

#### Implementation Steps:
1. Create ImageNote type handler
2. Implement IndexedDB storage for blobs
3. Create drag-and-drop UI
4. Add paste listener
5. Implement image compression/optimization
6. Add metadata extraction (EXIF)

### 2. Smart Layer Module
**Location**: `src/modules/smart-layer/`

#### Features:
- Create smart layers from images or text
- Multiple transformation types:
  - **OCR**: Extract text from images
  - **Caption**: Generate descriptive captions
  - **Concept**: Extract key concepts/entities
  - **Summarize**: Create summaries
  - **Translate**: Translate content
  - **Custom**: User-defined API calls
- Layer management UI
- Layer switching/comparison
- Caching system
- API configuration per layer

#### Components to Create:
```
src/modules/smart-layer/
├── index.ts                       # Module definition
├── layerHandler.ts                # Layer operations
├── transforms/                    # Transform implementations
│   ├── ocr.ts                    # OCR transform
│   ├── caption.ts                # Image captioning
│   ├── concept.ts                # Concept extraction
│   ├── summarize.ts              # Text summarization
│   ├── translate.ts              # Translation
│   └── custom.ts                 # Custom API calls
├── api/                          # API integrations
│   ├── openai.ts                 # OpenAI integration
│   ├── anthropic.ts              # Claude integration
│   ├── google.ts                 # Google Vision/Gemini
│   └── base.ts                   # Base API client
├── cache/                        # Caching system
│   └── layerCache.ts             # Transform result cache
└── components/
    ├── SmartLayerEditor.vue      # Main editor
    ├── SmartLayerViewer.vue      # Viewer with layer switching
    ├── LayerList.vue             # Layer management
    ├── LayerCard.vue             # Individual layer display
    ├── TransformConfig.vue       # Transform configuration UI
    ├── APIKeyManager.vue         # API key management
    └── LayerCompare.vue          # Side-by-side comparison
```

#### Implementation Steps:

**Phase 1: Core Infrastructure**
1. Create SmartLayerNote type and handler
2. Implement layer storage and management
3. Create caching system for transform results
4. Build base API client with retry logic

**Phase 2: Transform System**
5. Implement OCR transform (Tesseract.js or API)
6. Add image captioning (OpenAI Vision, Google Vision)
7. Create concept extraction (NLP API)
8. Build custom transform with template system

**Phase 3: UI Components**
9. Create layer list with add/delete
10. Build transform configuration dialog
11. Implement layer viewer with switching
12. Add comparison view
13. Create progress indicators for API calls

**Phase 4: API Integration**
14. OpenAI integration (GPT-4 Vision, GPT-4)
15. Anthropic Claude integration
16. Google Vision API integration
17. Local OCR fallback (Tesseract.js)

**Phase 5: Advanced Features**
18. Batch processing multiple images
19. Transform chaining (output of one → input of next)
20. Export individual layers
21. Version history for layers
22. Collaborative layer editing

### 3. Platform-Specific Features

#### Desktop (Electron)
**Location**: `electron/`

Features to add:
- Folder watching for auto-import
- System screenshot capture
- Native file dialogs
- Local OCR processing
- System notifications for completed transforms

```typescript
// electron/fileWatcher.js
import chokidar from 'chokidar';

export function watchFolder(path, callback) {
  const watcher = chokidar.watch(path, {
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on('add', (filePath) => {
    // Auto-import new images
    callback(filePath);
  });

  return () => watcher.close();
}
```

#### Mobile (Capacitor)
**Location**: `capacitor.config.json`

Features to add:
- Camera capture
- Photo library access
- Share extension
- Push notifications

```typescript
// src/composables/useCamera.ts
import { Camera, CameraResultType } from '@capacitor/camera';

export function useCamera() {
  async function capturePhoto() {
    const image = await Camera.getPhoto({
      quality: 90,
      resultType: CameraResultType.Base64,
    });
    return image.base64String;
  }

  return { capturePhoto };
}
```

#### Web (PWA)
Features to add:
- File System Access API
- Clipboard API enhancements
- Drag-and-drop from desktop

## Data Models

### Enhanced Note Types

```typescript
// src/types/note.ts (additions)

export interface ImageNote extends BaseNote {
  type: 'image';
  blob?: Blob;
  base64?: string;
  url?: string;
  blobId?: string;  // IndexedDB reference
  width?: number;
  height?: number;
  alt?: string;
  format?: string;  // 'png', 'jpg', etc.
  size?: number;    // bytes
  exif?: Record<string, any>;
}

export interface SmartLayerNote extends BaseNote {
  type: 'smart-layer';
  source: {
    type: 'image' | 'text' | 'url' | 'file';
    noteId?: string;  // Reference to source note
    data?: any;
  };
  layers: SmartLayer[];
  activeLayerId?: string;
}

export interface SmartLayer {
  id: string;
  name: string;
  type: 'ocr' | 'caption' | 'concept' | 'summarize' | 'translate' | 'custom';
  config: SmartLayerConfig;
  result?: any;
  cached: boolean;
  timestamp: number;
  error?: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
}

export interface SmartLayerConfig {
  apiProvider: 'openai' | 'anthropic' | 'google' | 'local';
  apiEndpoint?: string;
  model?: string;
  prompt?: string;
  parameters?: {
    temperature?: number;
    maxTokens?: number;
    [key: string]: any;
  };
}
```

## API Service Architecture

```typescript
// src/services/TransformService.ts

export class TransformService {
  private apiClients: Map<string, APIClient>;
  private cache: LayerCache;

  async executeTransform(
    layer: SmartLayer,
    sourceData: any,
    options?: TransformOptions
  ): Promise<any> {
    // Check cache first
    const cached = await this.cache.get(layer.id);
    if (cached && !options?.forceRefresh) {
      return cached;
    }

    // Get appropriate API client
    const client = this.getClient(layer.config.apiProvider);

    // Execute transform with retry logic
    const result = await this.executeWithRetry(async () => {
      return await client.transform(layer.type, sourceData, layer.config);
    });

    // Cache result
    await this.cache.set(layer.id, result);

    return result;
  }

  private async executeWithRetry(
    fn: () => Promise<any>,
    maxRetries = 3
  ): Promise<any> {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    throw lastError;
  }
}
```

## UI Redesign

### Composer Enhancements

Add image upload button and preview:

```vue
<!-- src/components/Composer.vue additions -->
<template>
  <form class="floating-surface">
    <!-- Existing actions -->

    <!-- New: Image upload -->
    <button type="button" @click="triggerImageUpload">
      📷
    </button>

    <!-- New: Image preview if attached -->
    <div v-if="attachedImage" class="image-preview">
      <img :src="attachedImage.url" />
      <button @click="removeImage">×</button>
    </div>

    <!-- Existing textarea -->
  </form>
</template>
```

### Layer Management UI

```vue
<!-- src/modules/smart-layer/components/LayerList.vue -->
<template>
  <div class="layer-list">
    <div class="layer-header">
      <h3>Smart Layers</h3>
      <button @click="addLayer">+ Add Layer</button>
    </div>

    <draggable v-model="layers" item-key="id">
      <template #item="{ element: layer }">
        <LayerCard
          :layer="layer"
          :active="layer.id === activeLayerId"
          @click="selectLayer(layer.id)"
          @delete="deleteLayer(layer.id)"
          @configure="configureLayer(layer)"
          @refresh="refreshLayer(layer.id)"
        />
      </template>
    </draggable>
  </div>
</template>
```

## Configuration Management

```typescript
// src/stores/apiKeys.ts

export const useAPIKeysStore = defineStore('apiKeys', () => {
  const keys = useStorage<Record<string, string>>('api-keys', {});

  function setKey(provider: string, key: string) {
    keys.value[provider] = key;
  }

  function getKey(provider: string): string | undefined {
    return keys.value[provider];
  }

  function deleteKey(provider: string) {
    delete keys.value[provider];
  }

  return { keys, setKey, getKey, deleteKey };
});
```

## Testing Strategy

### Unit Tests
- Module registration
- Transform execution
- Cache functionality
- API client mocking
- Layer management

### Integration Tests
- Full transform pipeline
- Image upload flow
- Layer creation and switching
- Export/import with layers

### E2E Tests
- Drag-and-drop workflow
- Multi-layer creation
- Transform configuration
- Error handling

## Security Considerations

1. **API Key Storage**: Use environment variables or encrypted storage
2. **Input Validation**: Sanitize all user inputs and file uploads
3. **Rate Limiting**: Implement client-side rate limiting for API calls
4. **CORS**: Configure proper CORS for API endpoints
5. **File Size Limits**: Prevent DoS with max file size
6. **Content Type Validation**: Verify uploaded files are actually images

## Performance Optimization

1. **Image Compression**: Compress images before storage
2. **Lazy Loading**: Load transform results on-demand
3. **Worker Threads**: Process images in web workers
4. **Debouncing**: Debounce API calls during configuration
5. **Virtual Scrolling**: For large numbers of layers
6. **Progressive Loading**: Show low-res preview while loading full image

## Accessibility

1. **Alt Text**: Require or auto-generate alt text for images
2. **Keyboard Navigation**: Full keyboard support for layer management
3. **Screen Reader**: Proper ARIA labels for all controls
4. **High Contrast**: Support high contrast mode
5. **Focus Indicators**: Clear focus indicators

## Implementation Timeline

### Week 1: Foundation
- Image module basic functionality
- IndexedDB storage
- Drag-and-drop UI

### Week 2: Smart Layers Core
- Smart layer note type
- Layer management
- Caching system
- Base API client

### Week 3: Transforms
- OCR transform
- Image captioning
- Basic UI for layer creation

### Week 4: Advanced UI
- Layer switching
- Comparison view
- Configuration dialogs
- Progress indicators

### Week 5: API Integration
- OpenAI integration
- Alternative providers
- Error handling
- Rate limiting

### Week 6: Platform Features
- Electron folder watching
- Mobile camera capture
- PWA clipboard enhancements

### Week 7: Polish & Testing
- Comprehensive testing
- Performance optimization
- Documentation
- Bug fixes

## Questions to Answer Before Implementation

1. **Which AI providers should we support initially?**
   - OpenAI (GPT-4 Vision, GPT-4)
   - Anthropic Claude
   - Google Gemini/Vision
   - Local OCR (Tesseract.js)
   - Other?

2. **Image storage strategy?**
   - Maximum image size?
   - Compression quality?
   - IndexedDB quota handling?
   - Cloud backup option?

3. **Pricing model for API usage?**
   - User provides own API keys?
   - App provides API proxy?
   - Usage limits?

4. **Transform configuration flexibility?**
   - Pre-defined templates vs. full customization?
   - JSON schema for custom prompts?
   - Visual prompt builder?

5. **Layer collaboration?**
   - Should layers sync across devices?
   - Real-time collaboration on layers?
   - Layer sharing/export?

6. **Data export format?**
   - Include original images?
   - Include all layer results?
   - Markdown export with embedded results?

7. **Privacy concerns?**
   - Local-first processing options?
   - Data retention policy for cached transforms?
   - User consent for API usage?

8. **Performance targets?**
   - Max acceptable transform time?
   - UI responsiveness during processing?
   - Batch processing size limits?

Please review these questions and provide answers so I can create a detailed implementation plan for the specific feature set you want!
