import React from 'react';
import ReactDOM from 'react-dom';
import {Elem, SectionElem, Draw} from "./General.js";

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

class Pitch extends React.Component{
    constructor(props){
        super(props);
    }

    render(){
        return Elem('span', {ref:"pitch", className:"pitch"}, this.props.pitch);
    }
}

export {Accidental, Dot, OctaveDot, Pitch};