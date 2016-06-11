import converter from '../index';
import React from 'react';
import ReactDOM from 'react-dom';

describe('markdown-to-jsx', () => {
    const mountNode = document.body.appendChild(document.createElement('div'));
    const render = jsx => ReactDOM.render(jsx, mountNode);

    afterEach(() => ReactDOM.unmountComponentAtNode(mountNode));

    it('should throw if not passed a string (first arg)', () => {
        expect(() => converter('')).not.toThrow();

        expect(() => converter()).toThrow();
        expect(() => converter(1)).toThrow();
        expect(() => converter(function(){})).toThrow();
        expect(() => converter({})).toThrow();
        expect(() => converter([])).toThrow();
        expect(() => converter(null)).toThrow();
        expect(() => converter(true)).toThrow();
    });

    it('should throw if not passed an object or undefined (second arg)', () => {
        expect(() => converter('')).not.toThrow();
        expect(() => converter('', {})).not.toThrow();

        expect(() => converter('', 1)).toThrow();
        expect(() => converter('', function(){})).toThrow();
        expect(() => converter('', [])).toThrow();
        expect(() => converter('', null)).toThrow();
        expect(() => converter('', true)).toThrow();
    });

    it('should throw if not passed an object or undefined (third arg)', () => {
        expect(() => converter('', {})).not.toThrow();
        expect(() => converter('', {}, {})).not.toThrow();

        expect(() => converter('', {}, 1)).toThrow();
        expect(() => converter('', {}, function(){})).toThrow();
        expect(() => converter('', {}, [])).toThrow();
        expect(() => converter('', {}, null)).toThrow();
        expect(() => converter('', {}, true)).toThrow();
    });

    it('should handle a basic string', () => {
        const element = render(converter('Hello.'));
        const elementNode = ReactDOM.findDOMNode(element);
        const text = elementNode.querySelector('p');

        expect(text).not.toBe(null);
        expect(text.textContent).toBe('Hello.');
    });

    it('should not introduce an intermediate wrapper for basic strings', () => {
        const element = render(converter('Hello.'));
        const elementNode = ReactDOM.findDOMNode(element);
        const text = elementNode.querySelector('p');

        expect(text.childNodes.length).toBe(1);
        expect(text.childNodes[0].nodeType).toBe(3); // TEXT_NODE
    });

    describe('inline textual elements', () => {
        it('should handle emphasized text', () => {
            const element = render(converter('_Hello._'));
            const elementNode = ReactDOM.findDOMNode(element);

            const text = elementNode.querySelector('em');
            expect(text).not.toBe(null);
            expect(text.childNodes.length).toBe(1);
            expect(text.childNodes[0].nodeType).toBe(3); // TEXT_NODE
            expect(text.textContent).toBe('Hello.');
        });

        it('should handle double-emphasized text', () => {
            const element = render(converter('__Hello.__'));
            const elementNode = ReactDOM.findDOMNode(element);
            const text = elementNode.querySelector('strong');

            expect(text).not.toBe(null);
            expect(text.childNodes.length).toBe(1);
            expect(text.childNodes[0].nodeType).toBe(3); // TEXT_NODE
            expect(text.textContent).toBe('Hello.');
        });

        it('should handle triple-emphasized text', () => {
            const element = render(converter('___Hello.___'));
            const elementNode = ReactDOM.findDOMNode(element);
            const text = elementNode.querySelector('strong');

            expect(text).not.toBe(null);
            expect(text.childNodes.length).toBe(1);
            expect(text.childNodes[0].tagName).toBe('EM');
            expect(text.childNodes[0].childNodes[0].nodeType).toBe(3); // TEXT_NODE
            expect(text.childNodes[0].childNodes[0].textContent).toBe('Hello.');
        });

        it('should handle deleted text', () => {
            const element = render(converter('~~Hello.~~'));
            const elementNode = ReactDOM.findDOMNode(element);
            const text = elementNode.querySelector('del');

            expect(text).not.toBe(null);
            expect(text.childNodes.length).toBe(1);
            expect(text.childNodes[0].nodeType).toBe(3); // TEXT_NODE
            expect(text.textContent).toBe('Hello.');
        });

        it('should handle escaped text', () => {
            const element = render(converter('Hello.\_\_'));
            const elementNode = ReactDOM.findDOMNode(element);
            const text = elementNode.querySelector('p');

            expect(text).not.toBe(null);
            expect(text.childNodes.length).toBe(1);
            expect(text.childNodes[0].nodeType).toBe(3); // TEXT_NODE
            expect(text.textContent).toBe('Hello.__');
        });
    });

    describe('headings', () => {
        it('should handle level 1 properly', () => {
            const element = render(converter('# Hello World'));
            const elementNode = ReactDOM.findDOMNode(element);
            const heading = elementNode.querySelector('h1');

            expect(heading).not.toBe(null);
            expect(heading.textContent).toBe('Hello World');
        });

        it('should handle level 2 properly', () => {
            const element = render(converter('## Hello World'));
            const elementNode = ReactDOM.findDOMNode(element);
            const heading = elementNode.querySelector('h2');

            expect(heading).not.toBe(null);
            expect(heading.textContent).toBe('Hello World');
        });

        it('should handle level 3 properly', () => {
            const element = render(converter('### Hello World'));
            const elementNode = ReactDOM.findDOMNode(element);
            const heading = elementNode.querySelector('h3');

            expect(heading).not.toBe(null);
            expect(heading.textContent).toBe('Hello World');
        });

        it('should handle level 4 properly', () => {
            const element = render(converter('#### Hello World'));
            const elementNode = ReactDOM.findDOMNode(element);
            const heading = elementNode.querySelector('h4');

            expect(heading).not.toBe(null);
            expect(heading.textContent).toBe('Hello World');
        });

        it('should handle level 5 properly', () => {
            const element = render(converter('##### Hello World'));
            const elementNode = ReactDOM.findDOMNode(element);
            const heading = elementNode.querySelector('h5');

            expect(heading).not.toBe(null);
            expect(heading.textContent).toBe('Hello World');
        });

        it('should handle level 6 properly', () => {
            const element = render(converter('###### Hello World'));
            const elementNode = ReactDOM.findDOMNode(element);
            const heading = elementNode.querySelector('h6');

            expect(heading).not.toBe(null);
            expect(heading.textContent).toBe('Hello World');
        });
    });

    describe('images', () => {
        it('should handle a basic image', () => {
            const element = render(converter('![](/xyz.png)'));
            const elementNode = ReactDOM.findDOMNode(element);
            const image = elementNode.querySelector('img');

            expect(image).not.toBe(null);
            expect(image.getAttribute('alt')).toBe(null);
            expect(image.getAttribute('title')).toBe(null);
            expect(image.src).toBe('/xyz.png');
        });

        it('should handle an image with alt text', () => {
            const element = render(converter('![test](/xyz.png)'));
            const elementNode = ReactDOM.findDOMNode(element);
            const image = elementNode.querySelector('img');

            expect(image).not.toBe(null);
            expect(image.getAttribute('alt')).toBe('test');
            expect(image.getAttribute('title')).toBe(null);
            expect(image.src).toBe('/xyz.png');
        });

        it('should handle an image with title', () => {
            const element = render(converter('![test](/xyz.png "foo")'));
            const elementNode = ReactDOM.findDOMNode(element);
            const image = elementNode.querySelector('img');

            expect(image).not.toBe(null);
            expect(image.getAttribute('alt')).toBe('test');
            expect(image.getAttribute('title')).toBe('foo');
            expect(image.src).toBe('/xyz.png');
        });

        it('should handle an image reference', () => {
            const element = render(converter([
                '![][1]',
                '[1]: /xyz.png',
            ].join('\n')));

            const elementNode = ReactDOM.findDOMNode(element);
            const image = elementNode.querySelector('img');

            expect(image).not.toBe(null);
            /* bug in mdast: https://github.com/wooorm/mdast/issues/103 */
            expect(image.getAttribute('alt')).toBe(null);
            expect(image.getAttribute('title')).toBe(null);
            expect(image.src).toBe('/xyz.png');
        });

        it('should handle an image reference with alt text', () => {
            const element = render(converter([
                '![test][1]',
                '[1]: /xyz.png',
            ].join('\n')));

            const elementNode = ReactDOM.findDOMNode(element);
            const image = elementNode.querySelector('img');

            expect(image).not.toBe(null);
            expect(image.getAttribute('alt')).toBe('test');
            expect(image.getAttribute('title')).toBe(null);
            expect(image.src).toBe('/xyz.png');
        });

        it('should handle an image reference with title', () => {
            const element = render(converter([
                '![test][1]',
                '[1]: /xyz.png "foo"',
            ].join('\n')));

            const elementNode = ReactDOM.findDOMNode(element);
            const image = elementNode.querySelector('img');

            expect(image).not.toBe(null);
            expect(image.getAttribute('alt')).toBe('test');
            expect(image.getAttribute('title')).toBe('foo');
            expect(image.src).toBe('/xyz.png');
        });
    });

    describe('links', () => {
        it('should handle a basic link', () => {
            const element = render(converter('[foo](/xyz.png)'));
            const elementNode = ReactDOM.findDOMNode(element);
            const link = elementNode.querySelector('a');

            expect(link).not.toBe(null);
            expect(link.textContent).toBe('foo');
            expect(link.getAttribute('title')).toBe(null);
            expect(link.getAttribute('href')).toBe('/xyz.png');
        });

        it('should handle a link with title', () => {
            const element = render(converter('[foo](/xyz.png "bar")'));
            const elementNode = ReactDOM.findDOMNode(element);
            const link = elementNode.querySelector('a');

            expect(link).not.toBe(null);
            expect(link.textContent).toBe('foo');
            expect(link.getAttribute('title')).toBe('bar');
            expect(link.getAttribute('href')).toBe('/xyz.png');
        });

        it('should handle a link reference', () => {
            const element = render(converter([
                '[foo][1]',
                '[1]: /xyz.png',
            ].join('\n')));

            const elementNode = ReactDOM.findDOMNode(element);
            const link = elementNode.querySelector('a');

            expect(link).not.toBe(null);
            expect(link.textContent).toBe('foo');
            expect(link.getAttribute('title')).toBe(null);
            expect(link.getAttribute('href')).toBe('/xyz.png');
        });

        it('should handle a link reference with title', () => {
            const element = render(converter([
                '[foo][1]',
                '[1]: /xyz.png "bar"',
            ].join('\n')));

            const elementNode = ReactDOM.findDOMNode(element);
            const link = elementNode.querySelector('a');

            expect(link).not.toBe(null);
            expect(link.textContent).toBe('foo');
            expect(link.getAttribute('title')).toBe('bar');
            expect(link.getAttribute('href')).toBe('/xyz.png');
        });
    });

    describe('lists', () => {
        /* disabled pending a fix from mdast: https://github.com/wooorm/mdast/issues/104 */
        xit('should handle a tight list', () => {
            const element = render(converter([
                '- xyz',
                '- abc',
                '- foo',
            ].join('\n')));

            const elementNode = ReactDOM.findDOMNode(element);
            const list = elementNode.querySelector('ul');

            console.log(list.children[0].childNodes[0]);

            expect(list).not.toBe(null);
            expect(list.children.length).toBe(3);
            expect(list.children[0].textContent).toBe('xyz');
            expect(list.children[0].childNodes[0].nodeType).toBe(3); // TEXT_NODE
            expect(list.children[1].textContent).toBe('abc');
            expect(list.children[1].childNodes[0].nodeType).toBe(3); // TEXT_NODE
            expect(list.children[2].textContent).toBe('foo');
            expect(list.children[2].childNodes[0].nodeType).toBe(3); // TEXT_NODE
        });

        it('should handle a loose list', () => {
            const element = render(converter([
                '- xyz',
                '',
                '- abc',
                '',
                '- foo',
            ].join('\n')));

            const elementNode = ReactDOM.findDOMNode(element);
            const list = elementNode.querySelector('ul');

            expect(list).not.toBe(null);
            expect(list.children.length).toBe(3);
            expect(list.children[0].textContent).toBe('xyz');
            expect(list.children[0].children[0].tagName).toBe('P');
            expect(list.children[1].textContent).toBe('abc');
            expect(list.children[1].children[0].tagName).toBe('P');
            expect(list.children[2].textContent).toBe('foo');
            expect(list.children[2].children[0].tagName).toBe('P');
        });

        it('should handle an ordered list', () => {
            const element = render(converter([
                '1. xyz',
                '1. abc',
                '1. foo',
            ].join('\n')));

            const elementNode = ReactDOM.findDOMNode(element);
            const list = elementNode.querySelector('ol');

            expect(list).not.toBe(null);
            expect(list.children.length).toBe(3);
            expect(list.children[0].textContent).toBe('xyz');
            expect(list.children[1].textContent).toBe('abc');
            expect(list.children[2].textContent).toBe('foo');
        });

        it('should handle an ordered list with a specific start index', () => {
            const element = render(converter([
                '2. xyz',
                '3. abc',
                '4. foo',
            ].join('\n')));

            const elementNode = ReactDOM.findDOMNode(element);
            const list = elementNode.querySelector('ol');

            expect(list).not.toBe(null);
            expect(list.getAttribute('start')).toBe('2');
        });

        it('should handle a nested list', () => {
            const element = render(converter([
                '- xyz',
                '  - abc',
                '- foo',
            ].join('\n')));

            const elementNode = ReactDOM.findDOMNode(element);
            const list = elementNode.querySelector('ul');

            expect(list).not.toBe(null);
            expect(list.children.length).toBe(2);
            expect(list.children[0].children[0].textContent).toBe('xyz');
            expect(list.children[0].children[1].tagName).toBe('UL');
            expect(list.children[0].children[1].children[0].textContent).toBe('abc');
            expect(list.children[1].textContent).toBe('foo');
        });
    });

    describe('GFM task lists', () => {
        it('should handle unchecked items', () => {
            const element = render(converter('- [ ] foo'));
            const elementNode = ReactDOM.findDOMNode(element);
            const checkbox = elementNode.querySelector('ul li input');

            expect(checkbox).not.toBe(null);
            expect(checkbox.checked).toBe(false);
            expect(checkbox.parentNode.textContent).toBe('foo');
        });

        it('should handle checked items', () => {
            const element = render(converter('- [x] foo'));
            const elementNode = ReactDOM.findDOMNode(element);
            const checkbox = elementNode.querySelector('ul li input');

            expect(checkbox).not.toBe(null);
            expect(checkbox.checked).toBe(true);
            expect(checkbox.parentNode.textContent).toBe('foo');
        });

        it('should disable the checkboxes', () => {
            const element = render(converter('- [x] foo'));
            const elementNode = ReactDOM.findDOMNode(element);
            const checkbox = elementNode.querySelector('ul li input');

            expect(checkbox).not.toBe(null);
            expect(checkbox.disabled).toBe(true);
        });
    });

    describe('GFM tables', () => {
        it('should handle a basic table', () => {
            const element = render(converter([
                'foo|bar',
                '---|---',
                '1  |2',
                '',
            ].join('\n')));

            const elementNode = ReactDOM.findDOMNode(element);
            const table = elementNode.querySelector('table');
            const thead = table.querySelector('thead tr');
            const row = table.querySelector('tbody tr');

            expect(table).not.toBe(null);
            expect(thead).not.toBe(null);
            expect(thead.children.length).toBe(2);
            expect(thead.children[0].tagName).toBe('TH');
            expect(row).not.toBe(null);
            expect(row.children.length).toBe(2);
            expect(row.children[0].tagName).toBe('TD');
        });

        it('should handle a table with aligned columns', () => {
            const element = render(converter([
                'foo|bar',
                '--:|---',
                '1  |2',
                '',
            ].join('\n')));

            const elementNode = ReactDOM.findDOMNode(element);
            const table = elementNode.querySelector('table');
            const thead = table.querySelector('thead tr');
            const row = table.querySelector('tbody tr');

            expect(table).not.toBe(null);
            expect(thead).not.toBe(null);
            expect(thead.children.length).toBe(2);
            expect(thead.children[0].tagName).toBe('TH');
            expect(thead.children[0].style.textAlign).toBe('right');
            expect(row).not.toBe(null);
            expect(row.children.length).toBe(2);
            expect(row.children[0].tagName).toBe('TD');
            expect(row.children[0].style.textAlign).toBe('right');
        });
    });

    describe('arbitrary HTML', () => {
        it('should convert the HTML into the proper JSX object', () => {
            const object = converter('<dd>Hello</dd>');

            expect(object.type).toBe('dd');
            expect(object.children[0]).toBe('Hello');
        });

        it('should convert children with markdown markup into the proper JSX objects', () => {
            const object = converter('<dd>*Hello*</dd>');

            expect(object.type).toBe('dd');
            expect(object.children[0].type).toBe('em');
            expect(object.children[0].children[0]).toBe('Hello');
        });

        it('should convert custom HTML tags into JSX objects', () => {
            const object = converter('<test-object>Hello</test-object>');

            expect(object.type).toBe('test-object');
            expect(object.children[0]).toBe('Hello');
        });

        it('should convert HTML attributes to JSX props', () => {
            const object = converter('<dd class="foo">Hello</dd>');

            expect(object.type).toBe('dd');
            expect(object.props.className).toBe('foo');
            expect(object.children[0]).toBe('Hello');
        });

        it('should convert boolean HTML attributes to JSX props', () => {
            const object = converter('<dd disabled class="foo">Hello</dd>');

            expect(object.type).toBe('dd');
            expect(object.props.className).toBe('foo');
            expect(object.props.disabled).toBe(true);
            expect(object.children[0]).toBe('Hello');
        });

        it('should convert nested HTML to JSX objects', () => {
            const object = converter('<dd><dt>Hello</dt><dl>There</dl></dd>');

            expect(object.type).toBe('dd');
            expect(object.children[0].type).toBe('dt');
            expect(object.children[0].children[0]).toBe('Hello');
            expect(object.children[1].type).toBe('dl');
            expect(object.children[1].children[0]).toBe('There');
        });

        it('should convert the HTML into the proper JSX object, respecting overrides', () => {
            class MyComponent extends React.Component {
                render() {
                    return <div>{this.props.children}</div>;
                }
            }

            const object = converter('<dd>Hello</dd>', {}, {
                dd: {
                    component: MyComponent,
                    props: {
                        className: 'foo'
                    }
                }
            });

            expect(object.type).toBe(MyComponent);
            expect(object.props.className).toBe('foo');
            expect(object.children[0]).toBe('Hello');
        });
    });

    describe('horizontal rules', () => {
        it('should be handled', () => {
            const element = render(converter('---'));
            const elementNode = ReactDOM.findDOMNode(element);
            const rule = elementNode.querySelector('hr');

            expect(rule).not.toBe(null);
        });
    });

    describe('line breaks', () => {
        it('should be added for 2-space sequences', () => {
            const element = render(converter([
                'hello  ',
                'there',
            ].join('\n')));

            const elementNode = ReactDOM.findDOMNode(element);
            const lineBreak = elementNode.querySelector('br');

            expect(lineBreak).not.toBe(null);
        });
    });

    describe('fenced code blocks', () => {
        it('should be handled', () => {
            const element = render(converter([
                '```js',
                'foo',
                '```',
            ].join('\n')));

            const elementNode = ReactDOM.findDOMNode(element);
            const pre = elementNode.querySelector('pre');

            expect(pre).not.toBe(null);
            expect(pre.children[0].tagName).toBe('CODE');
            expect(pre.children[0].classList.contains('lang-js')).toBe(true);
            expect(pre.children[0].textContent).toBe('foo');
        });
    });

    describe('inline code blocks', () => {
        it('should be handled', () => {
            const element = render(converter('`foo`'));
            const elementNode = ReactDOM.findDOMNode(element);
            const code = elementNode.querySelector('code');

            expect(code).not.toBe(null);
            expect(code.childNodes[0].nodeType).toBe(3); // TEXT_NODE
            expect(code.textContent).toBe('foo');
        });
    });

    describe('footnotes', () => {
        it('should handle conversion of references into links', () => {
            const element = render(converter([
                'foo[^abc] bar',
                '',
                '[^abc]: Baz baz',
            ].join('\n')));

            const elementNode = ReactDOM.findDOMNode(element);

            const text = elementNode.children[0].textContent;
            const footnoteLink = elementNode.children[0].children[0];

            expect(text).toBe('fooabc bar');

            expect(footnoteLink).not.toBe(null);
            expect(footnoteLink.textContent).toBe('abc');
            expect(footnoteLink.getAttribute('href')).toBe('#abc');
            expect(footnoteLink.tagName).toBe('A');
            expect(footnoteLink.children[0].tagName).toBe('SUP');
        });

        it('should inject the definitions in a footer at the end of the root', () => {
            const element = render(converter([
                'foo[^abc] bar',
                '',
                '[^abc]: Baz baz',
            ].join('\n')));

            const elementNode = ReactDOM.findDOMNode(element);
            const definitions = elementNode.children[1];

            expect(definitions).not.toBe(null);
            expect(definitions.tagName).toBe('FOOTER');
            expect(definitions.children[0].tagName).toBe('DIV');
            expect(definitions.children[0].id).toBe('abc');
            expect(definitions.children[0].textContent).toBe('[abc]: Baz baz');
        });

        it('should handle single word footnote definitions', () => {
            const element = render(converter([
                'foo[^abc] bar',
                '',
                '[^abc]: Baz',
            ].join('\n')));

            const elementNode = ReactDOM.findDOMNode(element);
            const definitions = elementNode.children[1];

            expect(definitions).not.toBe(null);
            expect(definitions.tagName).toBe('FOOTER');
            expect(definitions.children[0].tagName).toBe('DIV');
            expect(definitions.children[0].id).toBe('abc');
            expect(definitions.children[0].textContent).toBe('[abc]: Baz');
        });
    });

    describe('overrides', () => {
        it('should substitute the appropriate JSX tag if given a component', () => {
            const FakeParagraph = (props) => <p className='foo'>{props.children}</p>;
            const element = render(
                converter('Hello.', {}, {p: {component: FakeParagraph}})
            );

            const elementNode = ReactDOM.findDOMNode(element);

            expect(elementNode.children.length).toBe(1);
            expect(elementNode.children[0].className).toBe('foo');
        });

        it('should add props to the appropriate JSX tag if supplied', () => {
            const element = render(
                converter('Hello.', {}, {p: {props: {className: 'abc'}}})
            );

            const elementNode = ReactDOM.findDOMNode(element);

            expect(elementNode.children.length).toBe(1);
            expect(elementNode.children[0].className).toBe('abc');
        });
    });
});
