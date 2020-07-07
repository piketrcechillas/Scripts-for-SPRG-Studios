Guide for Barrack, made my piketrcechillas

First, you need to create an Item corresponding to the unit you want to summon, then set its price 
normally. For example, if you want to summon more Nash, create an Item named Nash, then set these custom
parameters:

{id: 0,
unit: "Nash"}

id is the number corresponding to Nash's id in the database.

Then, set this parameter in the terrain for the shop (house etc.)

{barrack:true}

Finally, create a shop event where the terrain is, and put the item corresponding to the units you want
to summon into that event