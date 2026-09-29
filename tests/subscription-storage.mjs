/* Test-only persistent API-compatible storage. Never part of the deployed Worker. */
export class MemoryStorage{
 constructor(initial=[]){this.map=new Map(initial);this.tail=Promise.resolve();}
 async get(k){return structuredClone(this.map.get(k));}
 async put(k,v){this.map.set(k,structuredClone(v));}
 async delete(k){if(Array.isArray(k)){let n=0;for(const x of k)n+=this.map.delete(x)?1:0;return n;}return this.map.delete(k);}
 async list({prefix='',limit=10000}={}){return new Map([...this.map].filter(([k])=>k.startsWith(prefix)).sort(([a],[b])=>a.localeCompare(b)).slice(0,limit).map(([k,v])=>[k,structuredClone(v)]));}
 transaction(fn){const result=this.tail.then(async()=>{const before=structuredClone([...this.map]);try{return await fn(this);}catch(e){this.map=new Map(before);throw e;}});this.tail=result.catch(()=>{});return result;}
}
