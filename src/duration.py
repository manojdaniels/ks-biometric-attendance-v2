def calculate_duration(entry_time, exit_time):
    duration =int((exit_time-entry_time).total_seconds())
    hours, remaining=divmod (duration , 3600)
    min, secs=divmod(remaining, 60)
    return(f"{hours:02d}:{min:02d}:{secs:02d}")