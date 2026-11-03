import re,json
h=open('a1.html',encoding='utf8').read()
i=h.find('window.initialState = "')+len('window.initialState = ')
# JS string literal: find its end (unescaped quote followed by ;)
j=i+1
while True:
    if h[j]=='\\': j+=2; continue
    if h[j]=='"': break
    j+=1
lit=h[i:j+1]
state=json.loads(json.loads(lit))
print('top keys:',list(state.keys())[:20])
def walk(o,path=''):
    if isinstance(o,dict):
        if o.get('type')=='CUSTOM_CODE' and 'content' in o:
            yield path,o
        for k,v in o.items(): yield from walk(v,path+'/'+k)
    elif isinstance(o,list):
        for n,v in enumerate(o): yield from walk(v,path+'[%d]'%n)
rows=list(walk(state))
print(len(rows),'custom code tiles in state')
for p,o in rows:
    code=o['content'].get('code','') if isinstance(o['content'],dict) else ''
    print(str(o.get('order')).rjust(3),repr(o.get('tileName')).ljust(22),o['id'],'vis',o.get('visibility'),'draft',o.get('isDraft'),'chg',o.get('hasChanges'),'len',len(code),repr(code[:30]),p[:60])
json.dump(state,open('state.json','w'))
