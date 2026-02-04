# TODO

🎯: before launch

## Leetgolf
- make your own shareable problem
- Solver mode (although maybe just add a problem to LeetGolf.com)
- contest

## ArrayBox
- Add k6?

### Later
- Multi lang solve (get multiple bars)
- 🎯 Match on names across languages
  - rip apl cart / bqn crate (Adam's idea)
- add non-keyboard character set for APL, BQN, Kap
- train tacit view
- add shortcut for full docs
* add ctrl + shift + up/down for multi-line cursor for multi-line editing
* add alt + up/down 

### Fix 
- jumpiness of logo in top left of keyboard
- syntax highlighting is a little slow on larger inputs

#### Test Formatting Program
```
⍝ These are some combinators
_W    ← _{ ⍵ ⍶⍶ ⍵ }            ⍝ The Warbler
_C    ← _{ ⍵ ⍶⍶ ⍺ }            ⍝ The Cardinal
_B_   ← _{ ⍶⍶ ⍹⍹ ⍵ }_          ⍝ The BlueBird
_B1_  ← _{ ⍶⍶ ⍺ ⍹⍹ ⍵ }_        ⍝ The Blackbird
_Psi_ ← _{ (⍹⍹ ⍺) ⍶⍶ (⍹⍹ ⍵) }_ ⍝ The Psi Bird
Sq    ← ×_W                    ⍝ Square
Del   ← -_C⌺                   ⍝ Deltas

⎕ ← Del ⌽_B_⍳5             ⍝ Iota 5
⎕ ← +/⍳5                   ⍝ Plus reduce Iota 5
"cat" |_B1_-_Psi_≢ "mouse" ⍝ Length abs diff
```

TinyAPL Test
["hello⍘nworld!"‿⎕Unicode⋄⟨"a":"b"⋄"c":17⟩‿(⎕Import"std:math/polynomial")]

### Image Fixes (non-essential)
* image of doublestruck letters doesn't work for BQN
* TinyAPL strings should not be yellow (in image)
* image gen for ⊂◡(⌽5‿3)⍴⍳15

* •listSys formatting in BQN
* string formatting

Fix all of Madelines issues she pointed out

Update README for contributing
