/**
 * 离线缓存服务 - 使用PouchDB
 * 用于缓存AI生成的数据，减少API调用
 */

// 注意：这是可选功能，需要先安装PouchDB
// npm install pouchdb @types/pouchdb

interface CachedData<T> {
  _id: string;
  data: T;
  timestamp: number;
}

class OfflineCacheService {
  private db: any | null = null;
  private dbName = 'village_guide_cache';
  private isAvailable = false;

  async init() {
    try {
      // 动态导入PouchDB（可选依赖）
      const PouchDB = (await import('pouchdb')).default;
      this.db = new PouchDB(this.dbName);
      this.isAvailable = true;
      console.log('离线缓存服务已启用');
    } catch (error) {
      console.warn('PouchDB未安装，离线缓存功能不可用');
      this.isAvailable = false;
    }
  }

  /**
   * 保存数据到缓存
   */
  async set<T>(key: string, data: T, expiryMs: number = 86400000): Promise<void> {
    if (!this.isAvailable || !this.db) return;

    try {
      const doc: CachedData<T> = {
        _id: key,
        data,
        timestamp: Date.now()
      };

      // 尝试更新已存在的文档
      try {
        const existing = await this.db.get(key);
        await this.db.put({ ...doc, _rev: existing._rev });
      } catch {
        // 文档不存在，创建新文档
        await this.db.put(doc);
      }
    } catch (error) {
      console.error('缓存保存失败:', error);
    }
  }

  /**
   * 从缓存读取数据
   */
  async get<T>(key: string, maxAgeMs: number = 86400000): Promise<T | null> {
    if (!this.isAvailable || !this.db) return null;

    try {
      const doc: CachedData<T> = await this.db.get(key);
      
      // 检查是否过期
      if (Date.now() - doc.timestamp > maxAgeMs) {
        await this.db.remove(doc);
        return null;
      }

      return doc.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * 删除缓存
   */
  async remove(key: string): Promise<void> {
    if (!this.isAvailable || !this.db) return;

    try {
      const doc = await this.db.get(key);
      await this.db.remove(doc);
    } catch (error) {
      // 文档不存在或删除失败
    }
  }

  /**
   * 清理过期缓存
   */
  async cleanExpired(maxAgeMs: number = 86400000): Promise<void> {
    if (!this.isAvailable || !this.db) return;

    try {
      const result = await this.db.allDocs({ include_docs: true });
      const now = Date.now();
      
      const expiredDocs = result.rows
        .filter((row: any) => now - row.doc.timestamp > maxAgeMs)
        .map((row: any) => ({ ...row.doc, _deleted: true }));

      if (expiredDocs.length > 0) {
        await this.db.bulkDocs(expiredDocs);
        console.log(`已清理 ${expiredDocs.length} 条过期缓存`);
      }
    } catch (error) {
      console.error('清理缓存失败:', error);
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getStats(): Promise<{ total: number; size: number }> {
    if (!this.isAvailable || !this.db) {
      return { total: 0, size: 0 };
    }

    try {
      const info = await this.db.info();
      return {
        total: info.doc_count,
        size: info.data_size || 0
      };
    } catch {
      return { total: 0, size: 0 };
    }
  }
}

// 导出单例
export const offlineCache = new OfflineCacheService();

/**
 * 使用示例：
 * 
 * // 在App.tsx中初始化
 * useEffect(() => {
 *   offlineCache.init();
 * }, []);
 * 
 * // 在获取路线数据时使用缓存
 * const getRoutes = async (userCoord: string, village: string) => {
 *   const cacheKey = `routes_${village}_${userCoord}`;
 *   
 *   // 尝试从缓存读取
 *   const cached = await offlineCache.get(cacheKey, 3600000); // 1小时有效期
 *   if (cached) {
 *     console.log('使用缓存数据');
 *     return cached;
 *   }
 *   
 *   // 缓存未命中，调用API
 *   const data = await aiService.getRoutes(userCoord, village);
 *   
 *   // 保存到缓存
 *   await offlineCache.set(cacheKey, data);
 *   
 *   return data;
 * };
 */
