import re
import json

with open('ai-graph-top100.dot', 'r') as f:
    dot = f.read()

# Node regex: ID [label="label"[, image="url"][, other]]
node_re = re.compile(r'^(\w+)\s*\[(label\s*=\s*"([^"]*)"(,\s*image\s*=\s*"([^"]*)")?|image\s*=\s*"([^"]*)",\s*label\s*=\s*"([^"]*)"|(?:node_company|other attrs))?\];?', re.MULTILINE)

nodes = []
for m in node_re.finditer(dot):
    groups = m.groups()
    id_ = groups[0]
    # Complex because order varies
    label = None
    image = None
    if groups[2]:  # label first
        label = groups[2].replace('\\\\n', '\\n')
        if groups[4]:
            image = groups[4]
    elif groups[5]:  # image first
        image = groups[5]
        label = groups[6].replace('\\\\n', '\\n')
    else:
        # No label? Skip or default
        continue
    if not label:
        # Find label
        pass
    group = 'company' if id_.startswith('C_') else 'person'
    node = {'id': id_, 'label': label, 'group': group}
    if image:
        node['image'] = image.replace('150px', '200px')  # larger
        node['shape'] = 'image'
    nodes.append(node)

with open('nodes.json', 'w') as f:
    json.dump(nodes, f, indent=2)

# Edge regex
edge_re = re.compile(r'(\w+)\s*->\s*(\w+)\s*\[(label\s*=\s*"([^"]*)"),?\s*(style\s*=\s*(\w+))?\];?', re.MULTILINE)

edges = []
for m in edge_re.finditer(dot):
    fr, to, _, lab, _, sty = m.groups()
    if lab:
        lab = lab.replace('\\\\n', '\\n')
    dashes = sty == 'dashed' or sty == 'dotted'
    edges.append({'from': fr, 'to': to, 'label': lab or '', 'dashes': dashes})

with open('edges.json', 'w') as f:
    json.dump(edges, f, indent=2)

print('Parsed', len(nodes), 'nodes,', len(edges), 'edges')
