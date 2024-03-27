# all actions tas routing

all actions la mario must be in them for at least one frame (subframe transitions don't count)

`A: B` means action `A` implies action `B`. for example, you can't get `ACT_START_CRAWLING` without `ACT_CROUCHING`, so `ACT_START_CRAWLING: ACT_CROUCHING`.

we can write chains such as `ACT_STOP_CRAWLING: ACT_CRAWLING: ACT_START_CRAWLING: ACT_CROUCHING`.

the leftmost action of such a chain is the 'prime' action. these actions are what we target when routing, because all the ones on the right of the chains by definition come with the prime actions for free. however, care must be taken to make sure the transitions aren't subframe only
