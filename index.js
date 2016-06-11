import React from 'react';
import {DOMAttributeNames} from 'react/lib/HTMLDOMPropertyConfig.js';
import {parse} from 'remark';

import inverter from 'lodash.invert';
import camelcaser from 'lodash.camelcase';
import compactor from 'lodash.compact';

// now we can do O(1) lookups for swapping class -> className, etc.
const attributeToJSXPropMap = inverter(DOMAttributeNames);

const getType = Object.prototype.toString;
const tag_regex = /(?:)[A-Za-z-]+/;

const TEXT_NODE_TYPE = 'text';

export default function markdownToJSX(markdown, options = {}, overrides = {}) {
    let definitions;
    let footnotes;

    function getHTMLNodeTypeFromASTNodeType(node) {
        switch (node.type) {
        case 'break':
            return 'br';

        case 'delete':
            return 'del';

        case 'emphasis':
            return 'em';

        case 'footnoteReference':
            return 'a';

        case 'heading':
            return `h${node.depth}`;

        case 'image':
        case 'imageReference':
            return 'img';

        case 'inlineCode':
            return 'code';

        case 'link':
        case 'linkReference':
            return 'a';

        case 'list':
            return node.ordered ? 'ol' : 'ul';

        case 'listItem':
            return 'li';

        case 'paragraph':
            return 'p';

        case 'root':
            return 'div';

        case 'tableHeader':
            return 'thead';

        case 'tableRow':
            return 'tr';

        case 'tableCell':
            return 'td';

        case 'thematicBreak':
            return 'hr';

        case 'definition':
        case 'footnoteDefinition':
        case 'yaml':
            return null;

        default:
            return node.type;
        }
    }

    function formExtraPropsForHTMLNodeType(props = {}, ast) {
        switch (ast.type) {
        case 'footnoteReference':
            return {
                ...props,
                href: `#${ast.identifier}`,
            };

        case 'image':
            return {
                ...props,
                title: ast.title,
                alt: ast.alt,
                src: ast.url,
            };

        case 'imageReference':
            return {
                ...props,
                title: definitions[ast.identifier].title,
                alt: ast.alt,
                src: definitions[ast.identifier].url,
            };

        case 'link':
            return {
                ...props,
                title: ast.title,
                href: ast.url,
            };

        case 'linkReference':
            return {
                ...props,
                title: definitions[ast.identifier].title,
                href: definitions[ast.identifier].url,
            };

        case 'list':
            return {
                ...props,
                start: ast.start,
            };

        case 'tableCell':
        case 'th':
            return {
                ...props,
                style: {textAlign: ast.align},
            };
        }

        return props;
    }

    function seekCellsAndAlignThemIfNecessary(root, alignmentValues) {
        const mapper = (child, index) => {
            if (child.type === 'tableCell') {
                return {
                    ...child,
                    align: alignmentValues[index],
                };
            } else if (Array.isArray(child.children) && child.children.length) {
                return child.children.map(mapper);
            }

            return child;
        };

        if (Array.isArray(root.children) && root.children.length) {
            root.children = root.children.map(mapper);
        }

        return root;
    }

    function extractAttributeKVPairs(str) {
        // progressively scan the string; we can't use a regex here because they can't handle
        // mixed quote situations

        const pairs = {};
        let remainder = str;
        let idx;
        let subject;
        let predicate;
        let separator;

        while (remainder.length) {
            // scan until we hit a space, an equal sign, or the end
            for (let i = 0, len = remainder.length; i < len; i += 1) {
                if (i + 1 === len) {
                    // reached the end, this must be a boolean attribute
                    pairs[remainder] = true;
                    remainder = '';

                    return;

                } else if (remainder[i] === '=') {
                    subject = remainder.slice(0, i);

                    if (remainder[i + 1] === '"') {
                        // double-quoted value, grab up to the next double quote
                        predicate = remainder.slice(i + 2, remainder.indexOf('"', i + 2));

                    } else if (remainder[i + 1] === '\'') {
                        // single-quoted value, grab up to the next single quote
                        predicate = remainder.slice(i + 2, remainder.indexOf('\'', i + 2));

                    } else {
                        // naked value, just grab up to the next space or end
                        idx = remainder.indexOf(' ');
                        predicate = idx === -1 ? remainder.slice(i + 1) : remainder.slice(i + 1, idx);
                    }

                    pairs[subject] = predicate;
                    remainder = remainder.slice(subject.length + predicate.length + 1).trim();

                    return;
                }
            }
        }

        return pairs;
    }

    function attributeMapToJSXProps(mapping) {
        return Object.keys(mapping).reduce((map, key) => {
            if (key === 'style') {
                map[key] = mapping[key]
                            .split(/;\s?/)
                            .map(str => str.split(/:\s?/))
                            .reduce((map, style) => {
                                map[camelcaser(style[0])] = style[1];

                                return map;

                            }, {});
            } else {
                map[attributeToJSXPropMap[key] || key] = mapping[key];
            }

            return map;

        }, {});
    }

    function astToJSX(ast, index, array) { /* `this` is the dictionary of definitions */
        if (ast._IGNORE) {
            return null;
        }

        if (ast.type === TEXT_NODE_TYPE) {
            return ast.value;
        }

        const key = index || '0';

        if (ast.type === 'code') {
            return (
                <pre key={key}>
                    <code className={`lang-${ast.lang}`}>
                        {ast.value}
                    </code>
                </pre>
            );
        } /* Refers to fenced blocks, need to create a pre:code nested structure */

        if (ast.type === 'listItem') {
            if (ast.checked === true || ast.checked === false) {
                return (
                    <li key={key}>
                        <input key='checkbox'
                               type="checkbox"
                               checked={ast.checked}
                               disabled />
                        {ast.children.map(astToJSX)}
                    </li>
                );
            } /* gfm task list, need to add a checkbox */
        }

        if (ast.type === 'table') {
            const tbody = {type: 'tbody', children: []};

            ast.children = ast.children.reduce((children, child, index) => {
                if (index === 0) {
                    /* manually marking the first row as tableHeader since that was removed in remark@4.x; it's important semantically. */
                    child.type = 'tableHeader';
                    children.unshift(
                        seekCellsAndAlignThemIfNecessary(child, ast.align)
                    );
                } else if (child.type === 'tableRow') {
                    tbody.children.push(
                        seekCellsAndAlignThemIfNecessary(child, ast.align)
                    );
                } else if (child.type === 'tableFooter') {
                    children.push(
                        seekCellsAndAlignThemIfNecessary(child, ast.align)
                    );
                }

                return children;

            }, [tbody]);

        } /* React yells if things aren't in the proper structure, so need to
            delve into the immediate children and wrap tablerow(s) in a tbody */

        if (ast.type === 'tableFooter') {
            ast.children = [{
                type: 'tr',
                children: ast.children
            }];
        } /* React yells if things aren't in the proper structure, so need to
            delve into the immediate children and wrap the cells in a tablerow */

        if (ast.type === 'tableHeader') {
            ast.children = [{
                type: 'tr',
                children: ast.children.map(child => {
                    if (child.type === 'tableCell') {
                        child.type = 'th';
                    } /* et voila, a proper table header */

                    return child;
                })
            }];
        } /* React yells if things aren't in the proper structure, so need to
            delve into the immediate children and wrap the cells in a tablerow */

        if (ast.type === 'footnoteReference') {
            ast.children = [{type: 'sup', value: ast.identifier}];
        } /* place the identifier inside a superscript tag for the link */

        let htmlNodeType;
        let props = {key};

        if (ast.type === 'html') {
            // remark has two behaviors when it comes to HTML
            // 1. it will break apart non-block elements and process the insides
            // 2. if any block-level elements at all are included, the whole HTML string is left
            //    unprocessed

            const html = ast.value;
            let end_node;

            for (let i = array.length - 1; i > 0; i -= 1) {
                if (array[i].type === 'html') {
                    end_node = array[i];
                    break;
                }
            }

            ast.children = array.slice(index, array.indexOf(end_node)).map(node => {
                // skip these nodes in the future loop iterations, since they're already handled
                node._IGNORE = true;

                return astToJSX(node);
            });

            htmlNodeType = html.match(tag_regex)[0];

            const attribute_pairs = extractAttributeKVPairs(
                html.slice(html.indexOf(htmlNodeType) + 1, html.length - 2)
            ); // omit space after tag name and end character (>)

            props = {...attributeMapToJSXProps(attribute_pairs)};

        } /* arbitrary HTML: find the matching end tag, then recursively process the interim children */

        htmlNodeType = htmlNodeType || getHTMLNodeTypeFromASTNodeType(ast);
        if (htmlNodeType === null) {
            return null;
        } /* bail out, not convertable to any HTML representation */

        const override = overrides[htmlNodeType];
        if (override) {
            if (override.component) {
                htmlNodeType = override.component;
            } /* sub out the normal html tag name for the JSX / ReactFactory
                 passed in by the caller */

            if (override.props) {
                props = {...override.props, ...props};
            } /* apply the prop overrides beneath the minimal set that are necessary
                 to have the markdown conversion work as expected */
        }

        /* their props + our props, with any duplicate keys overwritten by us
           (necessary evil, file an issue if something comes up that needs
           extra attention, only props specified in `formExtraPropsForHTMLNodeType`
           will be overwritten on a key collision) */
        const finalProps = formExtraPropsForHTMLNodeType(props, ast);

        if (ast.children && ast.children.length === 1) {
            if (ast.children[0].type === TEXT_NODE_TYPE) {
                ast.children = ast.children[0].value;
            }
        } /* solitary text children don't need full parsing or React will add a wrapper */

        const children =   Array.isArray(ast.children)
                         ? compactor(ast.children.map(astToJSX))
                         : ast.children;

        return React.createElement(htmlNodeType, finalProps, ast.value || children);
    }

    function extractDefinitionsFromASTTree(ast) {
        const reducer = (aggregator, node) => {
            if (node.type === 'definition' || node.type === 'footnoteDefinition') {
                aggregator.definitions[node.identifier] = node;

                if (node.type === 'footnoteDefinition') {
                    if (   node.children
                        && node.children.length === 1
                        && node.children[0].type === 'paragraph') {
                        node.children[0].children.unshift({
                            type: 'textNode',
                            value: `[${node.identifier}]: `,
                        });
                    } /* package the prefix inside the first child */

                    aggregator.footnotes.push(
                        <div key={node.identifier} id={node.identifier}>
                            {node.value || node.children.map(astToJSX)}
                        </div>
                    );
                }
            }

            return   Array.isArray(node.children)
                   ? node.children.reduce(reducer, aggregator)
                   : aggregator;
        };

        return [ast].reduce(reducer, {
            definitions: {},
            footnotes: []
        });
    }

    if (typeof markdown !== 'string') {
        throw new Error(`markdown-to-jsx: the first argument must be
                         a string`);
    }

    if (getType.call(options) !== '[object Object]') {
        throw new Error(`markdown-to-jsx: the second argument must be
                         undefined or an object literal ({}) containing
                         valid remark options`);
    }

    if (getType.call(overrides) !== '[object Object]') {
        throw new Error(`markdown-to-jsx: the third argument must be
                         undefined or an object literal with shape:
                         {
                            htmltagname: {
                                component: string|ReactComponent(optional),
                                props: object(optional)
                            }
                         }`);
    }

    options.position = options.position || false;
    options.footnotes = options.footnotes || true;

    let remarkAST;

    try {
        remarkAST = parse(markdown, options);
    } catch (error) {
        return error;
    }

    const extracted = extractDefinitionsFromASTTree(remarkAST);

    definitions = extracted.definitions;
    footnotes = extracted.footnotes;

    const jsx = astToJSX(remarkAST);

    if (footnotes.length) {
        jsx.props.children.push(
            <footer key='footnotes'>{footnotes}</footer>
        );
    }

    return jsx;
}
