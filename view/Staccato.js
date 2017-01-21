import ReactDOM from 'react-dom';

import { Row, Col, Button } from 'react-bootstrap';

import {parse} from './StaccatoParser.pegjs';

import scoreText from '../What_A_Friend.txt';

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

let IndexNote = function(notes){
    return notes.map(function(elem, index){
        elem.index = index;
        return elem;
    })
}

let GetAccidentals = function(notes){
    let res = [];
    notes.forEach(function(note){
        note.accidental && res.push({index : note.index, accidental : note.accidental});
    })
    return res;
}

let GetConnectionRanges = function(notes){
    let res = [];
    notes.forEach(function(note){

        // inserting the first opening connection point
        (res.length==0 && note.upperConn == "open") && res.push({start:note.index});

        // if res.last exists, and has found another opening
        // connection, push a new element. illegally successive
        // opennings will be omitted.
        (res.length>0 && res[res.length - 1].end && note.upperConn == "open") && res.push({start:note.index});

        // if res.last.end is not being assigned, assign
        // it with the first found closing. The following
        // closings will be omitted.

        if(res.length>0 && !res[res.length-1].end && note.upperConn == "close"){
            res[res.length-1].end = note.index
        }

    })

    return res;
}

let GetUnderbarRanges = function(notes){

    let curr =[];
    let res  =[];

    notes.forEach(function(note){

        for (var i = 0; i < Math.max(note.conn.length, curr.length); i++) {

            // condition of rewriting current underbar:
            // curr[i] exists, and have same type with note.conn[i]
            if(curr[i] && curr[i].type == note.conn[i]){

                curr[i].end = note.index;

            } else {

                // if curr[i] exists, but note.conn[i] doesn't exist,
                // or has different type to curr[i], the current bar
                // is done.
                curr[i] && res.push(curr[i]);

                // if note.conn[i] exists, but curr[i] could be either
                // not created or finished, assign it with a new object.
                // if not, then rewrite as undefined.
                curr[i] = note.conn[i] ? {start:note.index, end:note.index, level:i, type:note.conn[i]} : undefined;
            }
        }

    })

    // console.log(JSON.stringify(res));
    return res;
}

let GetOctaves = function(notes){

    let res = [];

    notes.forEach(function(note){
        note.octave && res.push({index: note.index, octave:note.octave});
    })

    return res;
}

let GetDurationOnly = function(notes){
    return notes.map(note => {return {"pitch" : note.pitch, "index" : note.index, "duration":note.duration}});
}

let GroupByMeasure = function(notes) {
    let initial = [[]];
    initial[0].duration = 0;

    return notes.reduce(function(measures, note){
        if (measures[measures.length - 1].duration < 4) {
            measures[measures.length - 1].push(note);
            measures[measures.length - 1].duration += note.duration;
        } else {
            measures.push([note]);
            measures[measures.length - 1].duration = note.duration;
        }
        return measures;
    }, initial);
}

let ScoreModel = function(notes){

    let indexed = IndexNote(notes);

    return {
        measures : GroupByMeasure(GetDurationOnly(indexed)),
        underbars : GetUnderbarRanges(indexed),
        accidentals : GetAccidentals(indexed),
        connects : GetConnectionRanges(indexed)
    }
}

class Score extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            notes : parse(this.props.text)
        }
    }

    render() {

        console.log(JSON.stringify(ScoreModel(this.state.notes)));

        let notes = this.state.notes.map((note, index) => Elem(Note, {className:"note", key:index, note : note.pitch}, null));
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
            value       : scoreText,
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
