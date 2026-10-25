from dataclasses import dataclass


@dataclass(frozen=True)
class RetryDecision:
    retry: bool
    delay_ms: int = 0


@dataclass(frozen=True)
class RetryPolicy:
    max_attempts: int = 5
    base_delay_ms: int = 1000
    factor: int = 2
    max_delay_ms: int = 60000

    def delay_for(self, failures: int) -> int:
        """Delay before the next try, given how many failures happened so far (1-based)."""
        delay = self.base_delay_ms * (self.factor ** (failures - 1))
        return min(delay, self.max_delay_ms)

    def decide(self, failures: int) -> RetryDecision:
        if failures >= self.max_attempts:
            return RetryDecision(retry=False)
        return RetryDecision(retry=True, delay_ms=self.delay_for(failures))
