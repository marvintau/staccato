import ReactDOM from 'react-dom';

import { Row, Col, Button } from 'react-bootstrap';

import {parse} from './StaccatoParser.pegjs';

let Elem = function(component, param, children){
    return React.createElement(component, param, children)
}

let SectionElem = function(sectionName, key, children){
    return Elem('div', {
        key : key,
        id : sectionName,
        className : sectionName
    }, children)
}

let Draw = function(component, param, children, to){
    ReactDOM.render( Elem(component, param, children), document.getElementById(to))
}


class Score extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            notes : parse(this.props.text)
        }
    }

    render() {
        console.log(this.state.notes)
        let notes = this.state.notes.map(note => Elem(Note, {className:"note", note : note.pitch}, null));
        return Elem('div', null, notes);
    }
}

class Note extends React.Component{
    constructor(props){
        super(props);
    }

    render(){
        return Elem('span', {}, this.props.note);
    }
}

class Container extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            value: "test text",
            sections : []
        };
    }

    handleChange(event) {

        let sectionFinder = /\s+(\w+)\s*:\s*\{([^:]*)\}/g;

        let text = event.target.value;

        let matched, newSections = [];
        while (matched = sectionFinder.exec(text)){
            newSections.push({name : matched[1], body : matched[2]})
        }

        this.setState((previousState) => ({
            value : text,
            sections : newSections
        }));
    }

    sectionElems(){
        let elems = [];

        for (var i = 0; i < this.state.sections.length; i++) {
            if(this.state.sections[i].name != "score"){
                elems.push(SectionElem(this.state.sections[i].name, i, this.state.sections[i].body));
            } else {
                let scoreElem = Elem(Score, {text:this.state.sections[i].body}, null);
                elems.push(SectionElem(this.state.sections[i].name, i, scoreElem));
            }

        }

        return elems;
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

        let preview = Elem(Col, {
            key : 'viewer',
            md  :  6,
            id  : 'preview',
            className:'preview',
        }, Elem('div', {id:'page', className:'page'}, this.sectionElems()))

        const row = Elem(Row, null,
            [editorWrapper, preview]
        );

        return row
    }
}

Draw(Container, null, "null", 'container');
