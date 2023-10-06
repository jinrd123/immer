function produce(target, callback) {
    const proxies = new Map();
    const copies = new Map();
  
    function createProxy(obj) { // 创建obj对象的代理对象
      if(!proxies.has(obj)) {
        const handler = {
          get(target, key) {
            const lastestObj = getLastest(target);
            return createProxy(lastestObj[key]); // 访问即对象代理化
          },
          set(target, key, value) {
            const copy = shallowCopy(target);
            copy[key] = value;
            return true;
          }
        }
        const proxy = new Proxy(obj, handler);
        proxies.set(obj, proxy);
        return proxy;
      }
      return proxies.get(obj);
    }
    function getLastest(target) { // 获取当前最新对象(未修改即为源对象，修改即为copy对象)
      return copies.get(target) || target;
    }
    function shallowCopy(obj) { // 如果从未copy，就浅拷贝obj；否则直接获取曾经的copy对象
      if(!copies.has(obj)) {
        const copy = Array.isArray(obj) ? [...obj] : {...obj};
        copies.set(obj, copy);
        return copy;
      }
      return copies.get(obj);
    }
  
    function finalize(obj) { // 以obj为根结点，合并copy的新对象与老obj的部分（尽可能地复用obj）
      if(!hasChanged(obj)) {
        return obj;
      } else {
        const copy = shallowCopy(obj); // 查看是否有曾经拷贝过的对象
        if(Array.isArray(copy)) {
          for(let i = 0; i < copy.length; i ++) {
            copy[i] = finalize(copy[i]);
          }
        } else { // 对象
          for(let key of Object.keys(copy)) {
            copy[key] = finalize(copy[key]);
          }
        }
        return copy;
      }
    
    }
    function hasChanged(obj) { // TODO:语义有待修正(应该是是否需要进行浅拷贝...也不是很准确)，一个对象结点如果有过修改，那么这个对象结点到根节点的所有结点都视为被修改
      // 如果obj非对象，而是一个普通值，那么视为没有修改，返回false
      if(typeof obj !== 'object') return false;
      // 对于对象结点，根据copies数组中是否存在克隆来判断是否发生过修改
      // 对于每一个对象结点，都要递归检查到对象树的叶子结点
      if(copies.has(obj)) return true;
      if(Array.isArray(obj)) {
        for(let i = 0; i < obj.length; i ++) {
          if(hasChanged(obj[i])) return true;
        }
      } else {
        for(let key of Object.keys(obj)) {
          if(hasChanged(obj[key])) return true;
        }
      }
      return false;
    }
  
  
  
    const proxy = createProxy(target); // 代理化初始对象
    callback(proxy); // 触发数据更新并利用proxy对象记录信息
    return finalize(target); // 合并更新信息，返回新对象
  }
  
  const obj = {a: {name: 'jrd'}};
  
  const result = produce(obj, (draft) => {
    draft.a.name = 'xhr';
  })
  
  console.log(result);
  console.log(result === obj);
  // console.log(obj);