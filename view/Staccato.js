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

    let currDuration = 0;

    notes.forEach(function(note){

        if(currDuration < 4){

            currDuration += note.duration;

            for (var i = 0; i < Math.max(note.conn.length, curr.length); i++) {

                // condition of rewriting current underbar:
                // curr[i] exists, and have same type with note.conn[i],
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
        } else {

            // if the current measure has been filled up, then
            // push all existing elements into res, and empty
            // the curr. So that we can seperate all underbars
            // belonging to different measures.
            currDuration = 0;

            for (var i = 0; i < curr.length; i++) {
                curr[i] && res.push(curr[i]);
            }

            curr = [];
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

let GroupByLength = function(notes, length) {
    let initial = [[]];
    let duration = 0;

    return notes.reduce(function(measures, note){
        if (duration < length) {
            measures[measures.length - 1].push(note);
            duration += note.duration;
        } else {
            measures.push([note]);
            duration = note.duration;
        }
        return measures;
    }, initial);
}

let ScoreModel = function(notes){

    let indexed = IndexNote(notes);

    return {
        measures : GroupByLength(GetDurationOnly(indexed), 4),
        underbars : GetUnderbarRanges(indexed),
        accidentals : GetAccidentals(indexed),
        connects : GetConnectionRanges(indexed)
    }
}

class Score extends React.Component{
    constructor(props){
        super(props);
    }

    render() {

        let scoreModel = ScoreModel(parse(this.props.text));

        let measureElems = scoreModel.measures.map((measure, index) => Elem(Measure, {key:index, measure:measure}, null));

        return Elem('div', null, measureElems);
    }
}

class Measure extends React.Component{
    constructor(props){
        super(props);
    }

    render() {
        // console.log(JSON.stringify(GroupByLength(this.props.measure, 1)));

        let extendedMeasures = []
        this.props.measure.forEach(function(note){
            if(note.duration > 1){
                extendedMeasures.push({pitch: note.pitch, duration: 1});
                for(let i = 1; i < note.duration; i++){
                    extendedMeasures.push({pitch: "-", duration : 1})
                }
            } else {
                extendedMeasures.push(note);
            }
        });

        let beatElems = GroupByLength(extendedMeasures, 1).map((beat, index) => Elem(Beat, {key:index, beat : beat}, null));
        return Elem('span', {className:"measure"}, beatElems);
    }
}

class Beat extends React.Component{
    constructor(props){
        super(props);
    }

    render() {
        // console.log(JSON.stringify(this.props.beat));
        let noteElems = this.props.beat.map((note, index) => Elem(Note, {key:index, note:note}, null));
        return Elem('span', {className: "beat"}, noteElems);
    }
}

class Note extends React.Component{
    constructor(props){
        super(props);
    }

    render(){
        return Elem('span', {className:"note"}, this.props.note.pitch);
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
