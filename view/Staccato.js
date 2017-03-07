import React from 'react';
import ReactDOM from 'react-dom';

import { Row, Col, Button } from 'react-bootstrap';

import {parse} from './StaccatoParser.pegjs';

import scoreText from '../What_A_Friend.txt';

import {default as Sidebar} from 'react-sidebar';


Array.prototype.riffle = function(func){
    let res = [];

    for(let i=0; i < this.length; i++){
        res.push(this[i]); res.push(func(this[i], i, this.length))
    }

    return res
}

Array.prototype.last = function(){
    return this[this.length - 1]
}

let Elem = function(component, param, children){
    return React.createElement(component, param, children)
}

let SectionElem = function(sectionName, key, children){
    return Elem('div', {
        key : key,
        ref : sectionName,
        id : sectionName,
        className : sectionName
    }, children)
}

let Draw = function(component, param, children, to){
    ReactDOM.render( Elem(component, param, children), document.getElementById(to))
}

class Vertbar extends React.Component{
    constructor(props){
        super(props);
    }

    render(){

        let bars = [];
        Object.keys(this.props.parts).forEach((_, index) => {
            bars.push(Elem('span', {key:index > 1 ? index + 500 : index , className:"vertbar"}, " "));
            if(index == 1){
                if(this.props.lyric){
                    bars.push(Elem(Lyric, Object.assign(this.props.lyric, {key:index+250})));
                }
                else
                    bars.push(Elem(Lyric, Object.assign([[" ", " ", " "]], {key:index+250})));
            }
        });

        return Elem('div', {className:"vertbars"}, bars);
    }
}

class Finalbar extends React.Component{
    constructor(props){
        super(props);
    }
    render(){

        let bars = [];
        Object.keys(this.props.parts).forEach((_, index) => {
            bars.push(Elem('span', {key:index > 1 ? index + 500 : index , className:"finalbar"}, " "));
            if(index == 1){
                if(this.props.lyric){
                    bars.push(Elem(Lyric, Object.assign(this.props.lyric, {key:index+250})));
                }
                else
                    bars.push(Elem(Lyric, Object.assign([[" ", " ", " "]], {key:index+250})));
            }
        });

        return Elem('div', {className:"finalbars"}, bars)
    }
}

class Underbar extends React.Component{
    constructor(props){
        super(props);
    }

    render(){

        let style = {
            left:this.props.left,
            width:this.props.width,
            top :this.props.top
        }

        return Elem('div', {style:style, className:"underbar"})
    }
}

class Repeatbar extends React.Component{
    constructor(props){
        super(props);
    }

    render(){
        return Elem('span', {className:"repeatbar" + (this.props.initial ? " initialbar" : "")}, [
            Elem('span', {className:"dotUpper", key:42944})
        ])
    }
}

class Measure extends React.Component{
    constructor(props){
        super(props);
        this.notePoses = {}
    }

    GetNotePoses(){
        let notePoses = {}

        for(let ithBeat in this.refs){
            if(ithBeat != "measure"){
                let elem = this.refs[ithBeat]
                Object.assign(notePoses, elem.notePoses)
            }
        }

        return notePoses;
    }

    SlotElems(){
        return this.props.measure.beats.map((slot, index)=>Elem(Slot, Object.assign(slot, {
            key : index,
            parts : this.props.parts
        })));
    }

    render() {
        // let width = (this.props.measure[0].beatNote.length == 0) ? {minWidth: 0} : {}
        return Elem('div', {style:{}, ref:"measure", className:"measure"}, this.SlotElems());
    }

    componentDidMount(){
        // this.notePoses = this.GetNotePoses()
    }
}

class Slot extends React.Component{
    constructor(props){
        super(props);
    }

    Elems(){
        let elems = [], index = 0;

        this.props.parts.forEach((partName, index) => {
            elems.push(Elem(Beat, Object.assign(this.props[partName], {key:index > 1 ? index + 500 : index})));
            if(index == 1){
                if(this.props.lyric){
                    elems.push(Elem(Lyric, Object.assign(this.props.lyric, {key:index+250})));
                }
                else
                    elems.push(Elem(Lyric, Object.assign([[" ", " ", " "]], {key:index+250})));
            }
        })

        // for (let part in this.props) {
        //     if (this.props.hasOwnProperty(part) && this.props[part]) {
        //         if(part != "lyric" && part != "parts"){
        //             elems.push(Elem(Beat, Object.assign(this.props[part], {key:index})));
        //             index++;
        //         }
        //         if(part == "lyric"){
        //             elems.push(Elem(Lyric, Object.assign(this.props[part], {key:index})));
        //         }
        //     }
        // }

        return elems;
    }

    render(){
        return Elem('div', {style:{}, ref:"slot", className:"slot"}, this.Elems());
    };
}

class Lyric extends React.Component{
    constructor(props){
        super(props);
    }

    LyricChars(chars){
        return chars.map((c, index) => Elem('div', {className:"lyricChar", key:index}, c));
    }

    Lyrics(){
        let elems = [];
        Object.keys(this.props).forEach((key, index) =>{
            if(key != "children" && this.props[key]){
                elems.push(Elem('span', {className:"lyricSlot", key:index}, this.LyricChars(this.props[key])));
            }
        })
        return elems;
    }

    render() {
        return Elem('span', {ref:"lyric", className: "lyricBeat"}, this.Lyrics());
    }

}

class Beat extends React.Component{
    constructor(props){
        super(props);

        this.state = {
            underbarPoses : this.props.underbar ? this.props.underbar.map((elem) => ({left:0, width:0, top:0})) : []
        }
    }

    GetNotePoses(){

        let notePoses = {};

        for(let ithNote in this.refs){
            if(ithNote != "beat"){
                notePoses[ithNote] = this.refs[ithNote].box
            }
        }

        return notePoses;
    }

    GetUnderbarPoses(notePoses, beatBox){

        // by subtracting the score position from the underbar position,
        // we made the new undarbar position relative to score element.

        return this.props.underbar.map((elem) => ({
            left:notePoses[elem.start].left - beatBox.left,
            width:notePoses[elem.end].right - notePoses[elem.start].left,
            top:notePoses[elem.start].bottom + elem.level * 3 - beatBox.top})
        )
    }


    NoteElems(){
        return this.props.notes.map((note, index)=>Elem(Note, {ref:index, key:index, note:note}));
    }

    UnderbarElems(offset){
        return this.state.underbarPoses.map((elem, index) => Elem(Underbar, {key:index+offset, left:elem.left, width:elem.width, top:elem.top}))
    }


    render() {

        // console.log(this.props)

        let underbarElems = this.UnderbarElems(this.NoteElems().length);
        let noteElems = this.NoteElems().concat(underbarElems);

        return Elem('span', {ref:"beat", className: "beat"}, noteElems);
    }

    componentDidMount(){

        let beatBox = this.refs.beat.getBoundingClientRect();

        this.setState({underbarPoses: this.props.underbar ? this.GetUnderbarPoses(this.GetNotePoses(), beatBox) : []})
    }

}

class Pitch extends React.Component{
    constructor(props){
        super(props);
    }

    render(){
        return Elem('span', {ref:"pitch", className:"pitch"}, this.props.pitch);
    }
}

class Note extends React.Component{
    constructor(props){
        super(props);
        this.box = { left : 0, right : 0 }

        this.state = {
            octaveDotPoses : []
        }
    }

    GetOctaveDotPoses(){

        let octaveDotPoses = []
        if(this.props.note.octave && this.props.note.octave.nums){
            let octave = this.props.note.octave;
            for (var i = 0; i < Math.abs(octave.nums); i++) {
                octaveDotPoses.push({
                    index : this.props.note.pitch,
                    left : (this.box.right - this.box.left) / 2,
                    top : octave.nums >= 0
                          ? (-5 * i - this.box.height/2)
                          : (3 * octave.start + 5 * i + this.box.height/2)
                })
            }
        }

        return octaveDotPoses;
    }

    PitchElem(){
        return Elem(Pitch, {key:0, ref:"note", className:"note", pitch:this.props.note.pitch})
    }

    OctaveDotElem(){
        return this.state.octaveDotPoses.map((elem, index) =>
            Elem(OctaveDot, {key:1+index, ref:"dot-"+index, pos:elem})
        )
    }

    AccidentalElem(){
        return this.props.note.accidental
        ? [Elem(Accidental, {key:205, ref:"acc", acc:this.props.note.accidental})]
        : []
    }

    DotElem(){
        return this.props.note.dotted
        ? [Elem(Dot, {key:204, ref:"dot"})]
        : []
    }

    render(){
        //
        // let style = {
        //     marginLeft : -this.props.note.conn.length *0.7,
        //     marginRight : -this.props.note.conn.length *0.7
        // }

        return Elem('span', {style:{}, className:"note"}, [this.PitchElem()].concat(this.DotElem()).concat(this.AccidentalElem()).concat(this.OctaveDotElem()))
    }

    componentDidMount(){
        this.box = this.refs.note.refs.pitch.getBoundingClientRect();

        this.setState({octaveDotPoses: this.GetOctaveDotPoses()})
    }
}

class Accidental extends React.Component {
    constructor(props){
        super(props);
    }

    render(){
        // console.log(this.props.acc)
        let accidental = this.props.acc == "#" ? "\ue10f" : "\ue11b"

        return Elem('span', {className : "accidental"}, accidental)
    }
}

class Dot extends React.Component {
    constructor(props){
        super(props);
    }

    render(){
        return Elem('span', {className:"dot"}, "·")
    }
}


class OctaveDot extends React.Component {
    constructor(props){
        super(props);
    }

    render(){
        return Elem('span', {style:this.props.pos, className:"octavedot"}, "·")
    }
}

class Connect extends React.Component {
    constructor(props){
        super(props);
    }

    GetSVGCurveText(AX, AY, CAX, CAY, CBX, CBY, BX, BY, thickness){
        return "M" + AX  + " " + AY +
          "C" + CAX + " " + CAY + "," + CBX  + " " + CBY + "," + BX + " " + BY +
          "C" + CBX + " " + (CBY + thickness) + "," + CAX + " " + (CAY + thickness) + "," + AX + " " + AY +
          "Z"
    }

    render(){

        let startX  = this.props.startLeft,
            startY  = this.props.startTop,
            startCX  = this.props.startCLeft,
            startCY  = this.props.startCTop,

            endX    = this.props.endLeft,
            endY    = this.props.endTop,
            endCX    = this.props.endCLeft,
            endCY    = this.props.endCTop,

            fakeStartX = endX - 200,
            fakeEndX = startX + 200,
            fakeStartY = endY,
            fakeEndY = startY,

            fakeStartCX = endCX - 180,
            fakeEndCX = startCX + 180,
            fakeStartCY = endCY,
            fakeEndCY = startCY;

        let elem;
        if (startY == endY) {
            elem = Elem('svg', {
                xmlns:"http://www.w3.org/2000/svg"},
                Elem('path', {
                    d: this.GetSVGCurveText(startX, startY, startCX, startCY, endCX, endCY, endX, endY, 2),
                    fill : "black"
                }
            ))
        } else {
            elem = Elem('svg', {
                xmlns:"http://www.w3.org/2000/svg"},
                Elem('path', {
                    d:  this.GetSVGCurveText(startX, startY, startCX, startCY, fakeEndCX, fakeEndCY, fakeEndX, fakeEndY, 2) +
                        this.GetSVGCurveText(fakeStartX, fakeStartY, fakeStartCX, fakeStartCY, endCX, endCY, endX, endY, 2),
                    fill : "black"
                }
            ))
        }

        return elem
    }
}

class Chorus extends React.Component{
    constructor(props){
        super(props);

        this.notePoses = {},

        this.state = {
            // connectPoses : this.props.connects.map(elem => ({startLeft:0, startCLeft:0, startTop:0, startCTop:0, endCLeft:0, endCTop:0, endLeft:0, endTop:0}))
        }
    }

    GetNotePoses(){
        let notePoses = {}

        for(let ithMeasure in this.refs){
            if(ithMeasure != "score"){
                let elem = this.refs[ithMeasure]
                Object.assign(notePoses, elem.notePoses)
            }
        }

        return notePoses;
    }

    GetConnectPoses(scoreBox){
        return this.props.connects.map(elem => ({
            startLeft:this.notePoses[elem.start].left - scoreBox.left,
            startTop : this.notePoses[elem.start].top - scoreBox.top,
            startCLeft: this.notePoses[elem.start].left - scoreBox.left + 5,
            startCTop : this.notePoses[elem.start].top - scoreBox.top - 15,
            endCLeft : this.notePoses[elem.end].left - scoreBox.left - 5,
            endCTop : this.notePoses[elem.end].top - scoreBox.top - 15,
            endLeft : this.notePoses[elem.end].left - scoreBox.left,
            endTop : this.notePoses[elem.end].top - scoreBox.top
        }))
    }

    ConnectElems(){
        return this.state.connectPoses.map((elem, index) => Elem(Connect, Object.assign(elem, {key:206+index})))
    }

    MeasureElems(){
        // console.log(this.props);

        return []
            .concat(this.props.measures.map((measure,index) =>{
                let elem = [Elem(Measure, {ref:"measure-"+index, measure: measure, parts:this.props.parts, key:index})];

                if(measure.measureType == "normal"){
                    elem.push(Elem(Vertbar, {key:5300+index-1, parts:this.props.parts}))
                } else if (measure.measureType == "rep_start"){
                    elem.push(Elem(Repeatbar, {key:5300+index-1, direction:"open", parts:this.props.parts}))
                } else if (measure.measureType == "rep_fin"){
                    elem.push(Elem(Repeatbar, {key:5300+index-1, direction:"close", parts:this.props.parts}))
                } else if (measure.measureType == "fin"){
                    elem.push(Elem(Vertbar, {key:5300+index-1, parts:this.props.parts}))
                    elem.push(Elem(Finalbar, {key:6300, parts:this.props.parts}))
                }

                return elem;
            }));
            // .concat(this.ConnectElems())
    }

    render() {
        return Elem('div', {ref:"score", className:"score"}, this.MeasureElems());
    }

    componentDidMount(){

        let scoreBox = this.refs.score.getBoundingClientRect()

        // this.notePoses = this.GetNotePoses()

        this.setState({
            // connectPoses:this.GetConnectPoses(scoreBox)
        })

    }
}

class Container extends React.Component {

    constructor(props) {
        super(props);

        // parse(scoreText);

        this.state = {
            text : scoreText,
            score : parse(scoreText)
        };
    }

    handleChange(event) {
        event.persist()

        let newText = event.target.value;

        this.setState((previousState) => ({
            text : newText,
            score : parse(newText)
        }));

    }

    render() {

        let sectionElems = [], index = 0;
        for (let section in this.state.score) {
            if (this.state.score.hasOwnProperty(section)) {
                if(section != "chorus"){
                    sectionElems.push(SectionElem(section, index, this.state.score[section]));
                } else {
                    sectionElems.push(Elem(Chorus, Object.assign(this.state.score.chorus, {key:index})));
                }
                index++;
            }
        }

        const editor = Elem('textarea', {
            id        : 'editor',
            className : 'editor',
            rows      : 30,
            placeholder : 'yep',
            spellCheck  : 'false',
            value       : this.state.text,
            onChange    : (event) => this.handleChange(event)
        })

        const editorWrapper = Elem(Col, {
            key : 'editor',
            md  :  4,
            className:"editor-wrapper"
        }, editor)

        let preview = Elem(Col, {
            key : 'viewer',
            md  :  6,
            id  : 'preview',
            className:'preview',
        }, Elem('div', {ref:"preview", id:'page', className:'page'}, sectionElems))

        const row = Elem(Row, {},
            [editorWrapper, preview]
        );

        return row
    }

    componentDidMount(){

        // this.setState((previousState) => ({
        //     value : previousState.text,
        //     sections : previousState.sections
        // }));

    }
}

Draw(Container, {}, "null", 'container');
