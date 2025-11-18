# 前端优化库集成指南

本项目已集成以下前端优化库，可根据需要选择性启用。

## 📦 已添加的库

### 1. Motion One - 动画库
官网: https://motion.dev/

**特点**:
- 🚀 高性能Web动画
- 📦 体积小巧
- 🎯 简洁易用的API

**使用示例**:
```typescript
import { animate } from '@motionone/dom';

// 简单动画
animate('.element', { opacity: [0, 1], transform: ['translateY(20px)', 'translateY(0)'] }, { duration: 0.8 });

// 滚动触发动画
animate(
  '.card',
  { opacity: [0, 1], y: [50, 0] },
  {
    duration: 0.6,
    easing: 'ease-out'
  }
);
```

---

### 2. Barba.js - 页面转场动画
官网: https://barba.js.org/

**特点**:
- 🎬 流畅的页面切换效果
- 🔄 无刷新页面转场
- 🎨 自定义转场动画

**使用示例**:
```typescript
import barba from '@barba/core';

barba.init({
  transitions: [{
    name: 'fade',
    leave(data) {
      return animate(data.current.container, { opacity: 0 }, { duration: 0.3 });
    },
    enter(data) {
      return animate(data.next.container, { opacity: [0, 1] }, { duration: 0.3 });
    }
  }]
});
```

---

### 3. PouchDB - 离线数据库
官网: https://github.com/pouchdb/pouchdb

**特点**:
- 💾 浏览器端NoSQL数据库
- 🔄 支持数据同步
- 📴 离线优先

**使用示例**:
```typescript
import PouchDB from 'pouchdb';

// 创建本地数据库
const db = new PouchDB('village_guide_cache');

// 保存数据
await db.put({
  _id: 'spot_101',
  name: '红军纪念馆',
  data: { /* 景点数据 */ },
  timestamp: Date.now()
});

// 读取数据
const spot = await db.get('spot_101');

// 清理过期数据
const result = await db.allDocs({ include_docs: true });
const now = Date.now();
const expired = result.rows.filter(row => 
  now - row.doc.timestamp > 86400000 // 24小时
);
for (const item of expired) {
  await db.remove(item.doc);
}
```

---

### 4. OpenTiny Editor - 富文本编辑器
官网: https://opentiny.github.io/tiny-editor/

**特点**:
- ✍️ 功能完整的富文本编辑
- 🎨 可定制化
- 🇨🇳 完整中文支持

**使用示例**:
```typescript
import { TinyEditor } from '@opentiny/tiny-editor';

// 在React组件中使用
const EditorComponent = () => {
  const [content, setContent] = useState('');

  return (
    <TinyEditor
      value={content}
      onChange={setContent}
      config={{
        height: 400,
        placeholder: '请输入内容...',
        toolbar: ['bold', 'italic', 'underline', '|', 'link', 'image']
      }}
    />
  );
};
```

---

### 5. Uppy - 文件上传组件
官网: https://github.com/transloadit/uppy

**特点**:
- 📤 强大的文件上传
- 📱 支持多种上传源
- 🎨 美观的UI

**使用示例**:
```typescript
import Uppy from '@uppy/core';
import Dashboard from '@uppy/dashboard';
import XHRUpload from '@uppy/xhr-upload';

const uppy = new Uppy({
  restrictions: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxNumberOfFiles: 5,
    allowedFileTypes: ['image/*', 'video/*']
  }
})
  .use(Dashboard, {
    inline: true,
    target: '#uppy-container',
    locale: {
      strings: {
        dropPasteImport: '拖拽文件到这里，或 %{browse}',
        browse: '选择文件'
      }
    }
  })
  .use(XHRUpload, {
    endpoint: 'https://your-upload-api.com/upload',
    fieldName: 'file'
  });

uppy.on('upload-success', (file, response) => {
  console.log('上传成功:', file.name, response.body.url);
});
```

---

## 🎯 集成建议

### 场景一：景点图片上传（使用Uppy）
在AdminSubmissionForm中集成Uppy，让村民上传景点照片。

### 场景二：离线缓存（使用PouchDB）
缓存AI生成的路线和景点数据，减少API调用。

### 场景三：页面动效（使用Motion One）
为景点卡片添加滚动进入动画，提升用户体验。

### 场景四：页面转场（使用Barba.js）
在路线切换时添加平滑的转场效果。

---

## 📝 实施步骤

1. **安装依赖**
```bash
npm install
```

2. **按需引入**
根据实际需求，在对应组件中引入库。

3. **配置使用**
参考上述示例代码进行配置。

---

## 💡 性能优化建议

### 1. 懒加载
```typescript
// 动态导入大型库
const loadEditor = async () => {
  const { TinyEditor } = await import('@opentiny/tiny-editor');
  return TinyEditor;
};
```

### 2. 代码分割
```typescript
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'animation': ['@motionone/dom', '@barba/core'],
          'upload': ['@uppy/core', '@uppy/dashboard']
        }
      }
    }
  }
};
```

### 3. 条件加载
只在需要时加载对应的库。

---

## 🔧 移动端优化

所有库均支持移动端，建议：
- 使用rem/vw单位
- 添加触摸事件支持
- 优化手势交互

---

**MiniMax Agent**  
*文档生成时间: 2025-11-19*
