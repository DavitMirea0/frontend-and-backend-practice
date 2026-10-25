from app.retry import RetryPolicy

policy = RetryPolicy(max_attempts=5, base_delay_ms=1000, factor=2, max_delay_ms=8000)


def test_first_failure_uses_base_delay():
    assert policy.delay_for(1) == 1000


def test_delay_doubles_each_failure():
    assert [policy.delay_for(n) for n in (1, 2, 3, 4)] == [1000, 2000, 4000, 8000]


def test_delay_is_capped():
    assert policy.delay_for(10) == 8000


def test_retries_while_under_max_attempts():
    d = policy.decide(4)
    assert d.retry is True and d.delay_ms == 8000


def test_goes_to_dlq_when_attempts_exhausted():
    assert policy.decide(5).retry is False
