import re,json,sys
def state(fn):
    h=open(fn,encoding='utf8').read()
    i=h.find('window.initialState = "')+len('window.initialState = ')
    j=i+1
    while True:
        if h[j]=='\\': j+=2; continue
        if h[j]=='"': break
        j+=1
    return json.loads(json.loads(h[i:j+1]))
def tiles(o,out):
    if isinstance(o,dict):
        if o.get('type')=='CUSTOM_CODE' and isinstance(o.get('content'),dict): out.append(o)
        for v in o.values(): tiles(v,out)
    elif isinstance(o,list):
        for v in o: tiles(v,out)
for fn in ['home_a.html','a1.html']:
    st=state(fn); out=[]; tiles(st,out)
    print('==',fn,len(out),'custom code tiles')
    for o in out:
        c=o['content'].get('code','')
        print('  ',repr(o.get('tileName'))[:24].ljust(24),'len',str(len(c)).rjust(6),' $:',str(c.count('$')).rjust(4),' ^:',str(c.count('^')).rjust(3),' script:',c.count('<script'),repr(c[:36]))
