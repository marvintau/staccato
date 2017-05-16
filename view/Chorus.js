import React from 'react';
import ReactDOM from 'react-dom';
import {Elem, SectionElem, Draw} from "./General.js";

import {Vertbar, Finalbar, Repeatbar} from "./Bars.js";

import {Tie} from "./Tie.js";

import {Measure} from "./Measure.js";

import {MeasureBlock} from "./MeasureBlock.js";

import {OctaveDot} from "./Signs.js";

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

class Bracket extends React.Component{
    constructor(props){
        super(props);
    }

    GetSVGCurveText(height, width){
        return  'M2 ' + (height) +
                'L2 12 '+
                'C10 10 14 6 16 0 '+
                'C14 6 12 10 6 12 '+
                'L6 ' + (height - 12) +
                'C8 ' + (height - 12) +' 12 '+ (height - 12) + ' 16 ' + (height) +
                'C12 '+ (height - 8) +' 10 '+ (height - 10) + ' 2 ' + (height - 12) + ' Z'
    }

    GetElem(height, width){
        return Elem('svg', { key:1,
            xmlns:"http://www.w3.org/2000/svg"},
            Elem('path', {
                d: this.GetSVGCurveText(height, width),
                fill : "black"
            }
        ))        
    }

    render(){
        let pos = this.props.pos;
        pos.width = 15;
        pos.height = pos.bottom - pos.top;
        return Elem('span', {style:pos, className:"bracket"}, [this.GetElem(pos.height, pos.width)]);
    }
}


class Chorus extends React.Component{
    constructor(props){
        super(props);

        this.state = {
            noteBoxes : [],
            underbars : [],
            brackets : [],
            ties : [],
            octaves : []
        }
    }

    GetTiePoses(startBox, endBox){

        let scoreLeft = !!this.state.scoreBox ? this.state.scoreBox.left : 0,
            scoreTop = !!this.state.scoreBox  ? this.state.scoreBox.top : 0;

        let height = 5;

        return {
            startLeft   : startBox.left - scoreLeft,
            startTop    : startBox.top - scoreTop + height,
            startCLeft  : startBox.left - scoreLeft + 2,
            startCTop   : startBox.top - scoreTop - 10 + height,
            endCLeft    : endBox.left - scoreLeft - 2,
            endCTop     : endBox.top - scoreTop - 10 + height,
            endLeft     : endBox.left - scoreLeft,
            endTop      : endBox.top - scoreTop + height
        }
    }

    BracketElems(){
        return this.state.brackets.map((bracket, index) =>{
            return Elem(Bracket, {pos:{top:bracket.top, left:bracket.left, bottom:bracket.bottom}, key:5200+index})
        });
    }


    MeasureBarElem(type, index, slot, pagination){
        let elem;
        if(type == "normal"){
            elem = [Elem(Vertbar, {style:{marginTop:pagination},key:5300+index-1, slot:slot })]
        } else if (type == "rep_start"){
            elem = [Elem(Repeatbar, {style:{marginTop:pagination},key:5300+index-1, direction:"open", slot:slot })]
        } else if (type == "rep_fin"){
            elem = [Elem(Repeatbar, {style:{marginTop:pagination},key:5300+index-1, direction:"close", slot:slot })]
        } else if (type == "fin"){
            elem = [Elem(Finalbar, {style:{marginTop:pagination},key:6300, slot:slot })]
        }

        return elem;
    }

    OctaveDotElems(){
        console.log(this.state);
        return this.state.octaves.map((octave, index) =>{
            
            let box = this.state.noteBoxes[octave.index],
                pos = {
                    left : box.left + box.width/2 - this.state.scoreBox.left + 27,
                    top :  box.bottom + 3 * octave.octave.level - 15
                }

            return Elem(OctaveDot, {key:1+index, ref:"dot-"+index, pos:pos})

        })
    }


    UnderbarElems(){

        let scoreLeft = !!this.state.scoreBox ? this.state.scoreBox.left : 0,
            scoreTop = !!this.state.scoreBox  ? this.state.scoreBox.top : 0;

        console.log(scoreTop);

        return this.state.underbars.map((underbar, index) => {

            let left = this.state.noteBoxes[underbar.start].left - scoreLeft + 30,
                right = this.state.noteBoxes[underbar.end].right - scoreLeft + 30,
                top = this.state.noteBoxes[underbar.start].bottom + (underbar.level-1) * 3 - 15 + document.body.scrollTop;

            return Elem(Underbar, {key: 1280 + index, left: left, width: right - left, top:top})
        })
    }

    TieElems(){

        let scoreLeft = !!this.state.scoreBox ? this.state.scoreBox.left : 0,
            scoreTop = !!this.state.scoreBox  ? this.state.scoreBox.top : 0;

        return this.state.ties.map((tie, index) => {

            let start = this.state.noteBoxes[tie.start],
                end   = this.state.noteBoxes[tie.end],
                pos   = this.GetTiePoses(start, end)

            return Elem(Tie, Object.assign(pos, {key:2147483647+index}))
        })

    }

    MeasureElems(){

        // console.log(this.props.chorus.measures);
        

        return []
            .concat(this.props.chorus.measures.map((measure,index) =>{

                let pagination = Math.ceil(index / 4) % 4 == 0 ? 50 : 0;

                console.log(pagination)

                if(!!measure.beats){
                    return [
                        Elem(MeasureBlock, {style:{marginTop:pagination}, ref: "measure-block-"+index, measure:measure, key:index*2}),
                        this.MeasureBarElem(measure.type, index, measure.beats[0], pagination)
                    ];
                } else {

                    let measureParts = measure.map((measurePart, index) => {
                        return Elem(Measure, {ref:"measure-"+index, measure: measurePart, key:index, style:"measure-inner"});
                    })

                    let measureBarParts = measure.map((measurePart, index) => {
                        return this.MeasureBarElem(measurePart.type, index, measurePart.beats[0])
                    });

                    return [Elem(MeasureBlock, {style:{marginTop:pagination}, ref: "measure-block-"+index, measure:measure, key:index*2}),
                            Elem('div', {key:index*2+1, className:"bar-block"}, measureBarParts)];
                }
            }))
            .concat(this.UnderbarElems())
            .concat(this.BracketElems())
            .concat(this.TieElems())
            .concat(this.OctaveDotElems())
    }

    render() {
        return Elem('div', {className:"score", ref:"score"}, this.MeasureElems());
    }


    Traverse(system){

        if(system == {} || !system){
            return [];
        }

        let listedSystem = Object.keys(system).map(key => system[key])

        return listedSystem.reduce((boxes, note) => {
            return boxes.concat( !!note.box ? {box:note.box, index:note.props.note.index} : this.Traverse(note.refs))
        }, [])
    }

    Permute(system){

        let traversed = this.Traverse(system);
        let permuted = [];

        for (var box of traversed){
            permuted[box.index] = box.box;
        }

        return permuted;
    }

    componentDidMount(){

        let scoreBox = this.refs.score.getBoundingClientRect();
        delete this.refs.score;

        let bracketsBoxes = this.props.chorus.measures.map((_, i) => {
        
            let box = this.refs["measure-block-"+i].blockBox;

            let offset = (Math.floor(box.bottom) - Math.floor(box.top));
            return {
                left:box.left - scoreBox.left,
                top:box.top,
                bottom:box.bottom
            }
        }).reduce(function(rv, x) { (rv[x["left"]] = rv[x["left"]] || []).push(x); return rv; }, {}),

            bracketsBoxesLeftmost = bracketsBoxes[Object.keys(bracketsBoxes)[0]];

        this.setState({
            scoreBox : scoreBox,
            noteBoxes : this.Permute(this.refs),
            underbars : this.props.chorus.underbars,
            brackets : bracketsBoxesLeftmost,
            ties : this.props.chorus.ties,
            octaves : this.props.chorus.octaves
        })

    }
}

export {Chorus};
