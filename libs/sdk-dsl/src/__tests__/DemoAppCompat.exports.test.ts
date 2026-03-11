import {
  BasicBlueTypes,
  DocBuilder,
  type JsonObject,
  type JsonValue,
  toOfficialJson,
  toOfficialYaml,
} from '../index.js';

describe('demo-app compatibility exports', () => {
  it('exports BasicBlueTypes and JSON helper types', () => {
    const typedObject: JsonObject = {
      status: 'ok',
      counters: [1, 2, 3],
      enabled: true,
    };
    const typedValue: JsonValue = typedObject;

    expect(BasicBlueTypes).toEqual({
      Text: 'Text',
      Integer: 'Integer',
      Double: 'Double',
      Boolean: 'Boolean',
      List: 'List',
      Dictionary: 'Dictionary',
    });
    expect(typedValue).toEqual(typedObject);
  });

  it('toOfficialJson accepts builder-like inputs and Blue nodes', () => {
    const builder = DocBuilder.doc()
      .name('Compat export')
      .type('Conversation/Event')
      .field('/count', 2);

    const node = builder.buildDocument();

    expect(toOfficialJson(builder)).toEqual(builder.buildJson());
    expect(toOfficialJson(node)).toEqual(builder.buildJson());
  });

  it('toOfficialYaml preserves the simple alias-style document shape', () => {
    const builder = DocBuilder.doc()
      .name('Compat export')
      .type('Conversation/Event')
      .field('/status', 'ready');

    expect(toOfficialYaml(builder)).toBe(
      ['name: Compat export', 'type: Conversation/Event', 'status: ready', '']
        .join('\n'),
    );
  });
});
