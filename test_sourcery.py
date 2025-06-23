def test_function(items):
    result = []
    for item in items:
        if item > 5:
            result.append(item)
    return result

def another_test():
    if True:
        x = 1
    else:
        x = 1
    return x
