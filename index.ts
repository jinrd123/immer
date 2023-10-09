// 欢迎来到 TypeScript 演练场，
// 这是一个给你提供编写，分享和学习 TypeScript 的网站。

// 您可以以如下三种方式使用它：
//
//  - 一个不会破坏任何东西的学习 TypeScript 的地方。
//  - 一个体验 TypeScript 语法并与被人分享的地方。
//  - 一个用于测试不同 TypeScript 编译期功能的沙箱。

// const anExampleVariable = "Hello World"
// console.log(anExampleVariable)

// 可以点击上方的 “示例” 或 “新闻”，以了解更多关于语言的信息。"
// 或者删除这些注释并且开始使用，整个演练场的世界都属于你。
// declare const strOrNumOrBool: string | number | boolean | Function;

// type Func = (...args: any[]) => any;

// type FunctionReturnType<T extends Func> = T extends (
//   ...args: any[]
// ) => infer R
//   ? R
//   : never;

// type FunctionReturnType<T extends Func> = T extends (
//   ...args: infer R
// ) => number
//   ? R
//   : never;

const produce: <T extends Record<string, any>>(immutableData: T, producer: (draft: T) => void) => T = (immutableData, producer) => {
    const mutations = new Map<object, object>();
    // const mutations: any = {};

    const draft = createDraft(immutableData, mutations);

    // 在草稿上应用更新函数
    producer(draft);

    let res = immutableData;

    if (mutations.size) {
        res = applyMutations(immutableData, mutations);
    }

    // 返回修改后的草稿
    return res;
}

const createDraft: <T extends Record<string, any>>(immutableData: T, mutations: Map<object, object>) => T = (immutableData, mutations) => {
    type T = typeof immutableData;

    const handler: ProxyHandler<T> = {
        set(_, propName: string, newVal) {
            // 在修改之前创建一个浅拷贝
            // const copied = Array.isArray(immutableData) ? [...immutableData] : { ...immutableData }

            if (mutations.has(immutableData)) {
                const copied = mutations.get(immutableData);
                // @ts-ignore
                const success = Reflect.set(copied, propName, newVal);
                return success;
            } else {
                const copied = Array.isArray(immutableData) ? [...immutableData] : { ...immutableData }
                const success = Reflect.set(copied, propName, newVal);

                mutations.set(immutableData, copied)
                return success;
            }
        },

        get(target, propName: string, receiver) {
            const value = Reflect.get(target, propName, receiver);

            return value && typeof value === 'object' ? createDraft(value, mutations) : value;
        }
    }

    const proxy = new Proxy(immutableData, handler)

    return proxy
}
const applyMutations: <T extends Record<string, any>>(immutableData: T, mutations: Map<object, object>) => T = (immutableData, mutations) => {
    type T = typeof immutableData;

    let copied;
    if (mutations.has(immutableData)) {
        copied = mutations.get(immutableData); // 获取immutableData的cp对象
    } else {
        return immutableData; // 递归退出的条件：如果mutation中无immutableData的cp对象（有两种情况，immutableData为对象，但未修改、immutableData为普通数据类型），直接返回(复用)immutableData
    }

    // copy对象才是最终对象的组成部分，所以所有修改都针对拷贝对象进行（而非immutableData）
    // 递归处理copy对象的所有属性
    if (Array.isArray(copied)) {

        for (let i = 0; i < copied.length; i++) {
            copied[i] = applyMutations(copied[i], mutations);
        }

        return copied as unknown as T;
    } else {
        // fix ts
        for (let key of Object.keys(copied!)) {
            let value = (copied as any)[key];
            (copied as any)[key] = applyMutations(value, mutations);
        }

        return copied as T;
    }
};

// 运行这段代码：
const obj = {
    a: {},
    b: [1, 2, 3],
    c: {
        d: {
            e: [3, 4, 5],
            f: 6,
        },
        f: 7,
    },
};

const copy = produce(obj, () => {
    // nothing to do
});
const modified = produce(obj, (draft) => {
    draft.a = {};
    draft.a = { name: 'xiaoming' }
    draft.b.push(4);
    draft.c.f = 8;
});

console.log('modified:', modified);

console.log('copy === obj:', copy === obj); // true 
console.log('modified === obj:', modified === obj); // false 
console.log('modified.a === obj.a:', modified.a === obj.a); // false 
console.log('modified.b === obj.b:', modified.b === obj.b); // false ------------fix-----------
console.log('modified.c === obj.c:', modified.c === obj.c); //false ------------fix-----------
console.log('modified.c.d === obj.c.d:', modified.c.d === obj.c.d); // true

// export {}
