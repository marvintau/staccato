{
  const FlattenScore = (scoreObject, conn) =>{
    return scoreObject.reduce((list, elem) => {
        return list.concat( elem.notes ?
            FlattenScore(elem.notes, elem.conn.concat(conn)) :
            (elem.conn ? Object.assign(elem, {"conn" : elem.conn.concat(conn)}) : Object.assign(elem, {"conn" : conn}))
        )}, [])
    };

  const half = note => {
  	if(note.duration){
    	note.duration /= 2
    } else {
    	for(let i = 0; i < note.notes.length; i++){
        	note.notes[i].duration /= 2
        }
    }

    return note
  }
}


Notes "notes"
  = _ first:Note rest:(_ Note)* _{

      var all = [first];

        for(let i = 0; i < rest.length; i ++){
          all.push(rest[i][1]);
        }

        return FlattenScore(all,[])
    }

HalfedNote "duration"
  = "(" _  first:Note _ next:Note _ ")" {

        return {
        	notes : [half(first), half(next)],
            conn : ["halfed"]
        }
    }
  / "(" _ first:Note _ next:Note _ last:Note _ ")" {

    	return {
        	notes : [half(first), half(next), half(last)],
            conn : ["triple"]
        }
    }

DottedNote "dotted"
  = "." first:FixedNote _ next:FixedNote{
  		first.duration *= 1.5;
        first.dotted = true;
        next.duration *= 0.5;
        next.conn.push("halfed");

        return {
        	notes : [first, next],
            conn : []
        }
    }

Note "note"
  = note:FixedNote rest:(_ "-")* _ {
  	  note.duration += rest.length;
      return note;
    }
  / halfed:HalfedNote {
      return halfed;
    }
  / dotted:DottedNote {
     return dotted;
  }

FixedNote "fixed"
  = "/" note:ModifiedPitch _ {
        note.duration = 1;
        note.upperConn = "open";
        note.conn = []
        return note;
    }

  / note:ModifiedPitch "\\" _ {
        note.duration = 1;
        note.upperConn = "close";
        note.conn = []
        return note;
    }
  / note:ModifiedPitch _ {
  		note.duration = 1;
        note.conn = []
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
    let oct = text();
    let obj = {};

    if(oct[0] == ','){
       obj.side = "negative";
    } else {
       obj.side = "positive";
    }

    obj.num = parseInt(oct[1])

    return obj;
  }

Accidental "accidental"
  = [b#n] { return text(); }

Pitch "pitch"
  = [0-7] { return {pitch : parseInt(text())}; }

_ "whitespace"
  = [ \t\n\r]*
