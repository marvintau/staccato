
{
    let noteCounter = 0;
    let tieOpen = false;

    function getSubProp(children, prop){
        let res = children.filter(n => !!n[prop]).map(n => n[prop]) .reduce((props, prop) => props.concat(prop), []);
        children.forEach(n => { delete n[prop]; })
        return res;
    };

    function getChildren(children, prop){
        let res = children.reduce((ps, p) => ps.concat(p[prop] ? p[prop] : p), []);
        children.forEach(p => {delete p[prop]})
        return res;
    }

}

Sections "all sections"
= _ sections:Section* {
    return sections
}

Section "section that contains different info"
=  "chorus" _ part:[a-zA-Z]+ _ "{" measures:Measure* "}" _ {

    let ties = ([].concat.apply([], measures.map(measure => measure.ties)))
    let underbars = ([].concat.apply([], measures.map(measure => measure.underbars).filter(underbars => underbars.length>0)));

    measures.forEach(measure =>{
        delete measure.ties;
        delete measure.underbars;
    })

    return {
        name : "chorus",
        part : part.join(""),
        content : { measures: measures,
                    ties : ties,
                    underbars :underbars
                }
    };
}
/ "verse" _ verseNumber:[0-9]+ _ '{' _ lyric:([^ \t\n\r\}]+ _)* '}' _ {
    return {
        name : "verses",
        number : parseInt(verseNumber),
        verses : lyric.map(l => l[0].join(""))
    };
}
/ "verse" _ verseNumber:[0-9]+ _ part:[a-zA-Z]+ _ '{' _ lyric:([^ \t\n\r\}]+ _)* '}' _ {
    return {
        name : "verses",
        part : part.join(""),
        number : parseInt(verseNumber),
        verses : lyric.map(l => l[0].join(""))
    };
}
/ "parts" _ '{' _ parts:([a-zA-Z]+ _)* '}' _ {
    return {
        name : "parts",
        parts : parts.map(elem => elem[0].join(""))
    };
}
/ "phony" _ '{' _ content:[a-zA-Z]+ _ '}' _ {
    return {
        name : "phony",
        phony : content.join("")
    };
}
/ section:[a-zA-Z]+ _ '{' _ content:[^\}]* '}' _ {
    return {
        literal : true,
        name : section.join(""),
        content : content.join("")
    }
}

Measure "measure"
= notes:Notes _ bar:MeasureBar _ {

    let beatRanges = []
    notes.forEach(note => {
        if(note.dotted){
            beatRanges.push(note.notes[0].index)
            beatRanges.push(note.notes[1].index)
        } else {
            beatRanges.push(note.range ? note.range : note.index)
        }
    });

    let underbars = getSubProp(notes, "underbar");
    let ties      = getSubProp(notes, "tie");

    return {
        beats : getChildren(notes, "notes"),
        beatRanges : beatRanges,
        underbars : underbars,
        ties : ties,
        type : bar.type
    }
}

Notes "notes"
= _ first:Note rest:(_ Note)* _{

    var all = [first];

    for(let i = 0; i < rest.length; i ++){
        all.push(rest[i][1]);
    }

    return all;
}

Note "note"
= note:FixedNote _ {
    return note;
}
/ halfed:HalfedNote {
    return halfed;
}
/ dotted:DottedNote {
    return dotted;
}

HalfedNote "duration"
="(" _ notes:(Note _)+ ")" {

    let p = notes.map(note => note[0]);

    p.forEach(n => {
        if(n.octave){
            n.octave.level ++;
        }
    })

    let subUnderbars = getSubProp(p, "underbar");
        subUnderbars.forEach(underbar => {
            underbar.level ++;
        })

    // 获得下划线的起止位置
    let ø = p.length - 1,

        rangeStart = p[0].range ? p[0].range.start : p[0].index,
        rangeEnd   = p[ø].range ? p[ø].range.end   : p[ø].index;

    return {
        notes: getChildren(p, "notes"),
        range : {start: rangeStart, end:rangeEnd},
        underbar : [{start:rangeStart, end:rangeEnd, level:1}].concat(subUnderbars),
        tie: getSubProp(p, "tie")
    }
}

DottedNote "dotted"
= "." first:FixedNote _ next:FixedNote {

    first.dotted = true;

    if(next.octave){
        next.octave.level ++;
    }

    return {
        notes : [first, next],
        dotted: true,
        range : {start:first.index, end:next.index},
        underbar : [{start:next.index, end:next.index, level:1}],
        tie: getSubProp([first, next], "tie")
    }
}

FixedNote "fixed"
= "/" note:ModifiedPitch _ {

    note.duration = 1;
    note.index = noteCounter++;

    tieOpen = note.index;

    return note;
}

/ note:ModifiedPitch "\\" _ {
    note.duration = 1;
    note.index = noteCounter++;

    if(tieOpen){
        note.tie = [{start: tieOpen, end:note.index}]
        tieOpen = null;
    }

    return note;
}
/ note:ModifiedPitch _ {
    note.duration = 1;
    note.index = noteCounter++;
    return note
}


ModifiedPitch "modified_pitch"
= acc:Accidental pitch:Pitch octave:Octave {
    pitch.accidental = acc;
    pitch.octave = octave;
    return pitch;
}
/ acc:Accidental pitch:Pitch {
    pitch.accidental = acc;
    return pitch;
}

/ pitch:Pitch octave:Octave {
    pitch.octave = octave;
    return pitch
}
/ pitch:Pitch {
    return pitch
}

Octave "octave"
= [,'][1-3] {

    return {dots:(text()[0] == ',') ? - parseInt(text()[1]) : parseInt(text()[1]), level:0}

}

Accidental "accidental"
= [b#n] {
    return text();
}

Pitch "pitch"
= [0-7] {
    return {pitch : parseInt(text())};
}
/ "-" {
    return {pitch : "–"}
}
/ pitch:[a-zA-Z89]+ {
    console.log('invalid pitch found: ' + pitch);
    return {pitch : "X"}
}

MeasureBar "measure bar"
= "||" _ {
    return {type : "fin"}
}
/ "\:|" _ {
    return {type : "rep_fin"}
}
/ "|\:" _ {
    return {type : "rep_start"}
}
/ "|" _ {
    return {type : "normal"}
}


_ "whitespace"
= [ \t\n\r]*
