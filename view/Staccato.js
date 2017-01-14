import ReactDOM from 'react-dom';

import { Row, Col, Button } from 'react-bootstrap';


let Elem = function(component, param, children){
    return React.createElement(component, param, children)
}

let Draw = function(component, param, children, to){
    ReactDOM.render( Elem(component, param, children), document.getElementById(to)
    )
}

class Container extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            value: "test text",
        };
    }

    handleChange(event) {

        let sectionFinder = /(\w+)\s*:\s*\{([^:]*)\}\s*/g;

        let text = event.target.value;

        let matched, sections = [];
        while (matched = sectionFinder.exec(text)){
            sections.push({name : matched[1], body : matched[2]})
        }

        this.setState((previousState) => {
            previousState.value = text;

            for (var i = 0; i < sections.length; i++) {
                previousState[sections[i].name] = sections[i].body
            }

            return previousState;
        });
    }

    render() {

        const editor = Elem('textarea', {
            id        : 'editor',
            className : 'editing',
            rows      : 20,
            placeholder : 'yep',
            spellCheck  : 'false',
            // value       : this.state.value
            onChange    : (event) => this.handleChange(event)
        })

        const editorWrapper = Elem(Col, {
            key : 'editor',
            md  :  4,
            className:"editing-wrapper"
        }, editor)

        const preview = Elem(Col, {
            key : 'viewer',
            md  :  6,
            id  : 'preview',
            className:'preview',
        }, Elem('div', {id:'page', className:'page'}, `${this.state.value}`))

        const row = Elem(Row, null,
            [editorWrapper, preview]
        );

        return row
    }
}

Draw(Container, null, "null", 'container');
