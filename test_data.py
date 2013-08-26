import random

from nltk.corpus import names

size = 100

words = names.words()
random.shuffle(words)

i = 0
for x in range(0, len(words), size):
    i += 1
    f = open('./data/%s.txt' % i, 'w')
    f.write('\n'.join(words[x:x + size]))
